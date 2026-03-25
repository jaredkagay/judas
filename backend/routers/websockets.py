from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import random
import time

from database import SessionLocal
import models
from ws_manager import manager

router = APIRouter()

async def send_organizer_sync(room_code: str, custom_phase: str = None):
    if room_code in manager.active_rooms and "ORGANIZER" in manager.active_rooms[room_code]:
        db = SessionLocal()
        try:
            game = db.query(models.GameSession).filter_by(room_code=room_code).first()
            players = db.query(models.Player).filter_by(room_code=room_code).all()
            
            # Exclude auxiliary displays and the organizer from the master player list
            player_data = [
                {
                    "alias": p.alias,
                    "role": p.role,
                    "is_alive": p.is_alive
                } for p in players if p.alias != "ORGANIZER" and not p.alias.startswith("AUX_")
            ]
            
            phase = custom_phase or (game.current_phase if game else "Lobby")
            
            await manager.send_personal_message({
                "event": "organizer_sync",
                "phase": phase,
                "players": player_data
            }, room_code, "ORGANIZER")
        finally:
            db.close()

async def handle_force_discussion(room_code: str):
    db = SessionLocal()
    try:
        alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).all()
        alive_aliases = [p.alias for p in alive_players]
        game = db.query(models.GameSession).filter_by(room_code=room_code).first()
        
        await manager.broadcast(room_code, {
            "event": "discussion_started",
            "discussion_time": game.discussion_time_sec if game else 60,
            "alive_agents": list(alive_aliases)
        })
        # Sync the host to the new phase
        await send_organizer_sync(room_code, "Discussion")
    finally:
        db.close()

async def handle_trigger_emergency(room_code: str, alias: str):
    db = SessionLocal()
    try:
        manager.meeting_acks[room_code] = set()
        manager.active_corpses[room_code] = {}
        alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).count()
        await manager.broadcast(room_code, {
            "event": "emergency_alert", 
            "caller": alias,
            "total_alive": alive_players 
        })
        await send_organizer_sync(room_code, "Emergency Alert")
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
                "discussion_time": game.discussion_time_sec if game else 60,
                "alive_agents": list(alive_aliases)
            })
            await send_organizer_sync(room_code, "Discussion")
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
        await send_organizer_sync(room_code, "Voting")
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
            was_imposter = None
            if len(leaders) == 1 and leaders[0] != "SKIP":
                eliminated_agent = leaders[0]
                dead_player = db.query(models.Player).filter_by(room_code=room_code, alias=eliminated_agent).first()
                if dead_player:
                    dead_player.is_alive = False
                    was_imposter = (dead_player.role == "Imposter")
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
                "was_imposter": was_imposter,
                "imposters_remaining": alive_imposters,
                "tally": tally,
                "game_over": winner is not None,
                "winner": winner,
                "reason": reason
            })
            await send_organizer_sync(room_code, "Vote Results")
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

async def handle_report_kill(room_code: str, victim_alias: str, killer_alias: str):
    db = SessionLocal()
    try:
        # 1. Mark the victim as dead in the database
        victim = db.query(models.Player).filter_by(room_code=room_code, alias=victim_alias).first()
        if victim and victim.is_alive:
            victim.is_alive = False
            db.commit()

        # 2. Generate a corpse ID so they can be reported
        if room_code not in manager.active_corpses:
            manager.active_corpses[room_code] = {}
            
        corpse_id = str(random.randint(100, 999))
        while corpse_id in manager.active_corpses[room_code]:
            corpse_id = str(random.randint(100, 999))
            
        manager.active_corpses[room_code][corpse_id] = victim_alias

        # 3. Tell the victim their new corpse ID
        await manager.send_personal_message({
            "event": "corpse_id_assigned",
            "corpse_id": corpse_id
        }, room_code, victim_alias)
        
        # 4. Secretly reset the killer's cooldown
        game = db.query(models.GameSession).filter_by(room_code=room_code).first()
        cooldown = game.cooldown_sec if game else 30
        
        await manager.send_personal_message(
            {"event": "kill_confirmed", "cooldown": cooldown}, 
            room_code, 
            killer_alias
        )

        # 5. Check if this kill won the game for the Imposters
        alive_imposters = db.query(models.Player).filter_by(room_code=room_code, role="Imposter", is_alive=True).count()
        alive_crewmates = db.query(models.Player).filter_by(room_code=room_code, role="Crewmate", is_alive=True).count()
        
        if alive_imposters >= alive_crewmates:
            await manager.broadcast(room_code, {
                "event": "game_over",
                "winner": "Imposters",
                "reason": "Imposters Outnumber Crewmates"
            })
        await send_organizer_sync(room_code, "Action Phase")
    finally:
        db.close()

async def handle_report_body(room_code: str, alias: str, corpse_id: str):
    db = SessionLocal()
    try:
        if room_code in manager.active_corpses and corpse_id in manager.active_corpses[room_code]:
            dead_alias = manager.active_corpses[room_code][corpse_id]
            
            manager.active_corpses[room_code] = {}
            manager.meeting_acks[room_code] = set()

            alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).count()

            await manager.broadcast(room_code, {
                "event": "body_reported_alert",
                "caller": alias,
                "target": dead_alias,
                "total_alive": alive_players
            })

            await send_organizer_sync(room_code, "Emergency Alert")
        else:
            await manager.send_personal_message({"event": "invalid_corpse_id"}, room_code, alias)
    finally:
        db.close()

async def handle_kick_player(room_code: str, target: str):
    db = SessionLocal()
    try:
        # 1. Remove the player from the database
        player = db.query(models.Player).filter_by(room_code=room_code, alias=target).first()
        if player:
            db.delete(player)
            db.commit()

        # 2. Tell the target player they've been kicked so their client disconnects
        await manager.send_personal_message({"event": "kicked"}, room_code, target)
        
        # 3. Clean up the connection manager reference
        manager.disconnect(room_code, target)
        
        # 4. Broadcast the updated roster to the lobby
        active_players = [p for p in manager.active_rooms.get(room_code, {}).keys() 
                          if p != "ORGANIZER" and not p.startswith("AUX_")]
        await manager.broadcast(room_code, {
            "event": "roster_update",
            "all_players": active_players
        })

        # 5. Handle Mid-Game Logic (Tasks and Win Conditions)
        game = db.query(models.GameSession).filter_by(room_code=room_code).first()
        if game and game.current_phase != "Lobby":
            
            # Remove the kicked player's tasks
            db.query(models.PlayerTask).filter_by(room_code=room_code, player_alias=target).delete()
            db.commit()

            # Recalculate total task progress
            all_tasks = db.query(models.PlayerTask).filter_by(room_code=room_code).all()
            if all_tasks:
                completed = sum(1 for t in all_tasks if t.is_completed)
                progress = int((completed / len(all_tasks)) * 100)
            else:
                progress = 0

            # Push the updated progress bar to everyone
            await manager.broadcast(room_code, {
                "event": "task_progress_update",
                "progress": progress
            })

            # Check for win conditions
            alive_imposters = db.query(models.Player).filter_by(room_code=room_code, role="Imposter", is_alive=True).count()
            alive_crewmates = db.query(models.Player).filter_by(room_code=room_code, role="Crewmate", is_alive=True).count()

            winner = None
            reason = ""

            # Win Condition A: Kicking the player removed the final unfinished tasks
            if progress == 100 and len(all_tasks) > 0:
                winner = "Crewmates"
                reason = "All Mission Objectives Completed"
            # Win Condition B: The kicked player was the last Imposter
            elif alive_imposters == 0:
                winner = "Crewmates"
                reason = "All Imposters Neutralized"
            # Win Condition C: The kicked player was a Crewmate, allowing Imposters to win by majority
            elif alive_imposters >= alive_crewmates:
                winner = "Imposters"
                reason = "Imposters Outnumber Crewmates"

            if winner:
                await manager.broadcast(room_code, {
                    "event": "game_over",
                    "winner": winner,
                    "reason": reason
                })

    finally:
        db.close()

async def handle_play_again(room_code: str):
    db = SessionLocal()
    try:
        game = db.query(models.GameSession).filter_by(room_code=room_code).first()
        if game:
            game.current_phase = "Lobby"
            
        players = db.query(models.Player).filter_by(room_code=room_code).all()
        for p in players:
            p.role = None
            p.is_alive = True
            
        db.query(models.PlayerTask).filter_by(room_code=room_code).delete()
        db.commit()
        
        await manager.broadcast(room_code, {
            "event": "return_to_lobby"
        })

        await send_organizer_sync(room_code, "Lobby")
    finally:
        db.close()

async def handle_report_kill(room_code: str, victim_alias: str, killer_alias: str):
    import time
    db = SessionLocal()
    try:
        killer = db.query(models.Player).filter_by(room_code=room_code, alias=killer_alias).first()
        victim = db.query(models.Player).filter_by(room_code=room_code, alias=victim_alias).first()

        if not killer or not victim:
            return

        # --- RULE 1: ARE THEY AN IMPOSTER? ---
        if killer.role != "Imposter":
            await manager.send_personal_message({
                "event": "kill_rejected",
                "reason": f"Agent {killer_alias} is not an Imposter."
            }, room_code, victim_alias)
            return

        # --- RULE 2: ARE THEY ON COOLDOWN? ---
        game = db.query(models.GameSession).filter_by(room_code=room_code).first()
        cooldown_sec = game.cooldown_sec if game else 30

        current_time = time.time()
        game_start = getattr(manager, 'game_start_times', {}).get(room_code, 0)
        last_kill = getattr(manager, 'last_kill_times', {}).get(room_code, {}).get(killer_alias, 0)
        
        # Check against whichever is most recent: the start of the game, or their last kill
        most_recent_timer_start = max(game_start, last_kill)

        if current_time - most_recent_timer_start < cooldown_sec:
            time_left = int(cooldown_sec - (current_time - most_recent_timer_start))
            await manager.send_personal_message({
                "event": "kill_rejected",
                "reason": f"Assassin's weapon is recharging ({time_left}s remaining)."
            }, room_code, victim_alias)
            return

        # --- VALIDATION PASSED! EXECUTE THE KILL ---
        
        # 1. Record the time of this kill
        if not hasattr(manager, 'last_kill_times'):
            manager.last_kill_times = {}
        if room_code not in manager.last_kill_times:
            manager.last_kill_times[room_code] = {}
            
        manager.last_kill_times[room_code][killer_alias] = current_time

        # 2. Mark victim as dead in DB
        victim.is_alive = False
        db.commit()

        # 3. Generate Corpse ID
        if room_code not in manager.active_corpses:
            manager.active_corpses[room_code] = {}

        corpse_id = str(random.randint(100, 999))
        while corpse_id in manager.active_corpses[room_code]:
            corpse_id = str(random.randint(100, 999))

        manager.active_corpses[room_code][corpse_id] = victim_alias

        # 4. Tell victim they died (this triggers the big red screen + corpse ID)
        await manager.send_personal_message({
            "event": "you_died",
            "corpse_id": corpse_id
        }, room_code, victim_alias)

        # 5. Secretly reset the Killer's cooldown
        await manager.send_personal_message({
            "event": "kill_confirmed",
            "cooldown": cooldown_sec
        }, room_code, killer_alias)

        # 6. Check Win Conditions
        alive_imposters = db.query(models.Player).filter_by(room_code=room_code, role="Imposter", is_alive=True).count()
        alive_crewmates = db.query(models.Player).filter_by(room_code=room_code, role="Crewmate", is_alive=True).count()

        if alive_imposters >= alive_crewmates:
            await manager.broadcast(room_code, {
                "event": "game_over",
                "winner": "Imposters",
                "reason": "Imposters Outnumber Crewmates"
            })

    finally:
        db.close()

async def handle_end_game(room_code: str):
    await manager.broadcast(room_code, {
        "event": "game_ended"
    })

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
            game = db.query(models.GameSession).filter_by(room_code=room_code).first()
            is_midgame = game and game.current_phase != "Lobby"

            if alias != "ORGANIZER" and not alias.startswith("AUX_"):
                player = db.query(models.Player).filter_by(room_code=room_code, alias=alias).first()
                
                # 1. NEW PLAYER JOINING
                if not player:
                    if is_midgame:
                        new_player = models.Player(room_code=room_code, alias=alias, role="Spectator", is_alive=False)
                        db.add(new_player)
                        db.commit()
                        
                        await manager.send_personal_message({
                            "event": "role_reveal",
                            "role": "Spectator",
                            "tasks": [],
                            "teammates": [],
                            "is_alive": False
                        }, room_code, alias)
                    else:
                        new_player = models.Player(room_code=room_code, alias=alias)
                        db.add(new_player)
                        db.commit()
                
                # 2. RETURNING PLAYER (If they refresh the page mid-game)
                else:
                    if is_midgame and player.role:
                        player_tasks = db.query(models.PlayerTask).filter_by(room_code=room_code, player_alias=alias).all()
                        tasks_payload = [{"id": t.id, "task_name": t.task_name, "location": t.location, "description": t.description, "is_completed": t.is_completed} for t in player_tasks]
                        teammates = [imp.alias for imp in db.query(models.Player).filter_by(room_code=room_code, role="Imposter").all() if imp.alias != alias] if player.role == "Imposter" else []
                        
                        await manager.send_personal_message({
                            "event": "role_reveal",
                            "role": player.role,
                            "tasks": tasks_payload,
                            "teammates": teammates,
                            "is_alive": player.is_alive
                        }, room_code, alias)

            # 3. AUXILIARY DEVICE JOINING MID-GAME
            elif alias.startswith("AUX_"):
                if is_midgame:
                    await manager.send_personal_message({
                        "event": "game_started",
                        "cooldown": game.cooldown_sec if game else 30
                    }, room_code, alias)

            # 4. SYNC GLOBAL TASK PROGRESS FOR ALL MID-GAME JOINERS
            if is_midgame:
                all_tasks = db.query(models.PlayerTask).filter_by(room_code=room_code).all()
                if all_tasks:
                    completed = sum(1 for t in all_tasks if t.is_completed)
                    await manager.send_personal_message({"event": "task_progress_update", "progress": int((completed / len(all_tasks)) * 100)}, room_code, alias)

            active_players = [p for p in manager.active_rooms[room_code].keys() 
                              if p != "ORGANIZER" and not p.startswith("AUX_")]
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
            elif action == "report_body":
                corpse_id = payload.get("corpse_id")
                await handle_report_body(room_code, alias, corpse_id)
            elif action == "play_again":
                if alias == "ORGANIZER":
                    await handle_play_again(room_code)
            elif action == "kick_player":
                if alias == "ORGANIZER":
                    target = payload.get("target")
                    await handle_kick_player(room_code, target)
            elif action == "report_kill":
                victim_alias = payload.get("victim")
                killer_alias = payload.get("killer")
                await handle_report_kill(room_code, victim_alias, killer_alias)
            elif action == "end_game":
                if alias == "ORGANIZER":
                    await handle_end_game(room_code)
            elif action == "force_discussion":
                if alias == "ORGANIZER":
                    await handle_force_discussion(room_code)
            elif action == "request_sync":
                if alias == "ORGANIZER":
                    await send_organizer_sync(room_code)
    
    except WebSocketDisconnect:
        manager.disconnect(room_code, alias)
        if room_code in manager.active_rooms:
            active_players = [p for p in manager.active_rooms[room_code].keys() 
                              if p != "ORGANIZER" and not p.startswith("AUX_")]
            await manager.broadcast(room_code, {
                "event": "roster_update",
                "all_players": active_players
            })