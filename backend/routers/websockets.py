from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

from database import SessionLocal
import models
from ws_manager import manager

router = APIRouter()

async def handle_trigger_emergency(room_code: str, alias: str):
    db = SessionLocal()
    try:
        manager.meeting_acks[room_code] = set()
        alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).count()
        await manager.broadcast(room_code, {
            "event": "emergency_alert", 
            "caller": alias,
            "total_alive": alive_players 
        })
    finally:
        db.close()

async def handle_acknowledge_meeting(room_code: str, alias: str):
    db = SessionLocal()
    try:
        alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).all()
        alive_aliases = {p.alias for p in alive_players}
        
        if room_code not in manager.meeting_acks:
            manager.meeting_acks[room_code] = set()
            
        manager.meeting_acks[room_code].add(alias)
        
        await manager.broadcast(room_code, {
            "event": "ack_update",
            "acks": len(manager.meeting_acks[room_code]),
            "total": len(alive_aliases)
        })
        
        if manager.meeting_acks[room_code].issuperset(alive_aliases):
            game = db.query(models.GameSession).filter_by(room_code=room_code).first()
            await manager.broadcast(room_code, {
                "event": "discussion_started",
                "discussion_time": game.discussion_time_sec if game else 60
            })
    finally:
        db.close()

async def handle_start_voting(room_code: str):
    manager.active_votes[room_code] = {} 
    db = SessionLocal()
    try:
        game = db.query(models.GameSession).filter_by(room_code=room_code).first()
        alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).all()
        alive_aliases = [p.alias for p in alive_players]
        
        await manager.broadcast(room_code, {
            "event": "voting_started",
            "voting_time": game.voting_time_sec if game else 60,
            "eligible_targets": alive_aliases 
        })
    finally:
        db.close()

async def handle_submit_vote(room_code: str, alias: str, target: str):
    db = SessionLocal()
    try:
        alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).all()
        alive_aliases = [p.alias for p in alive_players]
        
        if room_code not in manager.active_votes:
            manager.active_votes[room_code] = {}
            
        if alias in alive_aliases:
            manager.active_votes[room_code][alias] = target
        
        if len(manager.active_votes[room_code]) == len(alive_aliases):
            tally = {}
            for vote in manager.active_votes[room_code].values():
                tally[vote] = tally.get(vote, 0) + 1
            
            max_votes = max(tally.values())
            leaders = [agent for agent, votes in tally.items() if votes == max_votes]
            
            eliminated_agent = "NO ONE"
            if len(leaders) == 1 and leaders[0] != "SKIP":
                eliminated_agent = leaders[0]
                dead_player = db.query(models.Player).filter_by(room_code=room_code, alias=eliminated_agent).first()
                if dead_player:
                    dead_player.is_alive = False
                    db.commit()
            
            alive_imposters = db.query(models.Player).filter_by(room_code=room_code, role="Imposter", is_alive=True).count()
            alive_crewmates = db.query(models.Player).filter_by(room_code=room_code, role="Crewmate", is_alive=True).count()
            
            winner = None
            reason = ""
            if alive_imposters == 0:
                winner = "Crewmates"
                reason = "All Imposters Neutralized"
            elif alive_imposters >= alive_crewmates:
                winner = "Imposters"
                reason = "Imposters Outnumber Crewmates"
                
            await manager.broadcast(room_code, {
                "event": "vote_results",
                "eliminated": eliminated_agent,
                "tally": tally,
                "game_over": winner is not None,
                "winner": winner,
                "reason": reason
            })
    finally:
        db.close()

async def handle_complete_task(room_code: str, task_id: int):
    db = SessionLocal()
    try:
        task = db.query(models.PlayerTask).filter_by(id=task_id).first()
        if task and not task.is_completed:
            task.is_completed = True
            db.commit()
            
        all_tasks = db.query(models.PlayerTask).filter_by(room_code=room_code).all()
        if all_tasks:
            completed = sum(1 for t in all_tasks if t.is_completed)
            progress = int((completed / len(all_tasks)) * 100)
        else:
            progress = 0
            
        await manager.broadcast(room_code, {
            "event": "task_progress_update",
            "progress": progress
        })
        
        if progress == 100:
            await manager.broadcast(room_code, {
                "event": "game_over",
                "winner": "Crewmates",
                "reason": "All Mission Objectives Completed"
            })
    finally:
        db.close()

async def handle_report_neutralized(room_code: str, alias: str):
    db = SessionLocal()
    try:
        dead_player = db.query(models.Player).filter_by(room_code=room_code, alias=alias).first()
        if dead_player and dead_player.is_alive:
            dead_player.is_alive = False
            db.commit()
        
        alive_imposters = db.query(models.Player).filter_by(room_code=room_code, role="Imposter", is_alive=True).count()
        alive_crewmates = db.query(models.Player).filter_by(room_code=room_code, role="Crewmate", is_alive=True).count()
        
        if alive_imposters >= alive_crewmates:
            await manager.broadcast(room_code, {
                "event": "game_over",
                "winner": "Imposters",
                "reason": "Imposters Outnumber Crewmates"
            })
        else:
            await manager.broadcast(room_code, {
                "event": "cooldown_reset",
                "cooldown": 30
            })
    finally:
        db.close()

@router.websocket("/ws/{room_code}/{alias}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, alias: str):
    if room_code in manager.active_rooms and alias in manager.active_rooms[room_code]:
        await websocket.accept()
        await websocket.close(code=1008, reason="Name already taken")
        return

    await manager.connect(websocket, room_code, alias)
    try:
        db = SessionLocal()
        try:
            if alias != "ORGANIZER":
                player = db.query(models.Player).filter_by(room_code=room_code, alias=alias).first()
                if not player:
                    new_player = models.Player(room_code=room_code, alias=alias)
                    db.add(new_player)
                    db.commit()

            active_players = [p for p in manager.active_rooms[room_code].keys() if p != "ORGANIZER"]
        finally:
            db.close()

        await manager.broadcast(room_code, {
            "event": "roster_update", 
            "all_players": active_players
        })

        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            action = payload.get("action")

            if action == "trigger_emergency":
                await handle_trigger_emergency(room_code, alias)
            elif action == "acknowledge_meeting":
                await handle_acknowledge_meeting(room_code, alias)
            elif action == "start_voting":
                await handle_start_voting(room_code)
            elif action == "submit_vote":
                target = payload.get("target")
                await handle_submit_vote(room_code, alias, target)
            elif action == "complete_task":
                task_id = payload.get("task_id")
                await handle_complete_task(room_code, task_id)
            elif action == "report_neutralized":
                await handle_report_neutralized(room_code, alias)

    except WebSocketDisconnect:
        manager.disconnect(room_code, alias)
        if room_code in manager.active_rooms:
            active_players = [p for p in manager.active_rooms[room_code].keys() if p != "ORGANIZER"]
            await manager.broadcast(room_code, {
                "event": "roster_update",
                "all_players": active_players
            })