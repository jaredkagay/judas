from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import random
import string

from database import get_db
import models
import schemas
from ws_manager import manager

router = APIRouter()

def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase, k=4))

def get_randomized_tasks(all_tasks):
    hard_tasks = [t for t in all_tasks if t.difficulty == "Hard"]
    med_tasks = [t for t in all_tasks if t.difficulty == "Medium"]
    easy_tasks = [t for t in all_tasks if t.difficulty == "Easy"]
    
    assigned_hard = random.sample(hard_tasks, min(1, len(hard_tasks)))
    assigned_med = random.sample(med_tasks, min(2, len(med_tasks)))
    assigned_easy = random.sample(easy_tasks, min(3, len(easy_tasks)))
    
    return assigned_hard + assigned_med + assigned_easy

def assign_imposters(players, requested_count):
    actual_count = min(requested_count, max(1, len(players) - 1))
    return random.sample(players, actual_count) if players else []

@router.post("/host")
def create_game(config: schemas.HostConfig, db: Session = Depends(get_db)):
    new_code = generate_room_code()
    while db.query(models.GameSession).filter(models.GameSession.room_code == new_code).first():
        new_code = generate_room_code()

    new_game = models.GameSession(
        room_code=new_code, 
        host_id=config.host_id,
        current_phase="Lobby",
        imposter_count=config.imposter_count,
        cooldown_sec=config.cooldown_sec,
        discussion_time_sec=config.discussion_time_sec,
        voting_time_sec=config.voting_time_sec
    )
    db.add(new_game)
    db.commit()
    return {"room_code": new_code, "status": "Lobby Created"}

@router.post("/start/{room_code}")
async def start_game(room_code: str, db: Session = Depends(get_db)):
    game = db.query(models.GameSession).filter_by(room_code=room_code).first()
    game.current_phase = "Playing"
    
    players = db.query(models.Player).filter_by(room_code=room_code).all()
    all_tasks = db.query(models.TaskDictionary).filter_by(host_id=game.host_id).all()
    
    imposters = assign_imposters(players, game.imposter_count)
    imposter_ids = {imp.id for imp in imposters}
    
    dummy_id_counter = -1 

    for player in players:
        assigned_tasks = get_randomized_tasks(all_tasks)
        player_tasks_to_send = []
        
        if player.id in imposter_ids:
            player.role = "Imposter"
            other_imposters = [imp.alias for imp in imposters if imp.id != player.id]
            
            for t in assigned_tasks:
                player_tasks_to_send.append({
                    "id": dummy_id_counter, 
                    "task_name": t.task_name,
                    "location": t.location,
                    "description": t.description,
                    "is_completed": False
                })
                dummy_id_counter -= 1
                
            await manager.send_personal_message(
                {"event": "role_reveal", "role": player.role, "tasks": player_tasks_to_send, "teammates": other_imposters}, 
                room_code, 
                player.alias
            )
        else:
            player.role = "Crewmate"
            for t in assigned_tasks:
                new_pt = models.PlayerTask(
                    room_code=room_code,
                    player_alias=player.alias,
                    task_name=t.task_name,
                    location=t.location,
                    description=t.description 
                )
                db.add(new_pt)
                db.flush() 
                
                player_tasks_to_send.append({
                    "id": new_pt.id,
                    "task_name": new_pt.task_name,
                    "location": new_pt.location,
                    "description": new_pt.description,
                    "is_completed": False
                })
                
            await manager.send_personal_message(
                {"event": "role_reveal", "role": player.role, "tasks": player_tasks_to_send}, 
                room_code, 
                player.alias
            )
        
    db.commit()
    await manager.broadcast(room_code, {"event": "game_started", "cooldown": game.cooldown_sec})
    
    return {"status": "Game Started"}