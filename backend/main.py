from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import random
import string
import json
import hashlib

# Import the database stuff we just made
from database import engine, Base, get_db, SessionLocal
import models

# This line tells SQLAlchemy to create the tables in the among_us.db file
models.Base.metadata.create_all(bind=engine)
app = FastAPI()

# This is crucial so your React app (on port 5173) can talk to your Python app (on port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH & HOST ROUTE SCHEMAS ---
class HostAuth(BaseModel):
    username: str
    password: str

class TemplateUpdate(BaseModel):
    imposter_count: int
    cooldown_sec: int
    discussion_time_sec: int
    voting_time_sec: int

def hash_password(password: str) -> str:
    """Basic SHA-256 hashing for the prototype."""
    return hashlib.sha256(password.encode()).hexdigest()

# --- AUTH ENDPOINTS ---
@app.post("/register")
def register_host(auth: HostAuth, db: Session = Depends(get_db)):
    # Check if user exists
    existing_host = db.query(models.Host).filter(models.Host.username == auth.username).first()
    if existing_host:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new host
    new_host = models.Host(
        username=auth.username,
        password_hash=hash_password(auth.password)
    )
    db.add(new_host)
    db.commit()
    db.refresh(new_host)

    # Automatically create a default Game Template for this new host
    default_template = models.GameTemplate(
        host_id=new_host.id,
        imposter_count=1,
        cooldown_sec=30
    )
    db.add(default_template)
    db.commit()

    return {"host_id": new_host.id, "username": new_host.username}

@app.post("/login")
def login_host(auth: HostAuth, db: Session = Depends(get_db)):
    host = db.query(models.Host).filter(models.Host.username == auth.username).first()
    if not host or host.password_hash != hash_password(auth.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {"host_id": host.id, "username": host.username}

# --- TEMPLATE ENDPOINTS ---
@app.get("/template/{host_id}")
def get_template(host_id: int, db: Session = Depends(get_db)):
    template = db.query(models.GameTemplate).filter(models.GameTemplate.host_id == host_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@app.put("/template/{host_id}")
def update_template(host_id: int, config: TemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(models.GameTemplate).filter(models.GameTemplate.host_id == host_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.imposter_count = config.imposter_count
    template.cooldown_sec = config.cooldown_sec
    template.discussion_time_sec = config.discussion_time_sec
    template.voting_time_sec = config.voting_time_sec
    db.commit()
    return template

class ConnectionManager:
    def __init__(self):
        # Now maps: { room_code: { alias: WebSocket } }
        self.active_rooms = {}
        self.active_votes = {}
        self.meeting_acks = {}

    async def connect(self, websocket: WebSocket, room_code: str, alias: str):
        await websocket.accept()
        if room_code not in self.active_rooms:
            self.active_rooms[room_code] = {}
        # Bind the specific WebSocket to the player's alias
        self.active_rooms[room_code][alias] = websocket

    def disconnect(self, room_code: str, alias: str):
        if room_code in self.active_rooms and alias in self.active_rooms[room_code]:
            del self.active_rooms[room_code][alias]

    async def broadcast(self, room_code: str, message: dict):
        if room_code in self.active_rooms:
            for connection in self.active_rooms[room_code].values():
                await connection.send_text(json.dumps(message))
                
    async def send_personal_message(self, message: dict, room_code: str, alias: str):
        """Whisper a secret message to a specific player."""
        if room_code in self.active_rooms and alias in self.active_rooms[room_code]:
            websocket = self.active_rooms[room_code][alias]
            await websocket.send_text(json.dumps(message))

manager = ConnectionManager()

def generate_room_code():
    """Generates a random 4-letter uppercase code."""
    return ''.join(random.choices(string.ascii_uppercase, k=4))

class TaskCreate(BaseModel):
    host_id: int
    task_name: str
    location: str
    difficulty: str
    description: str

class TaskUpdate(BaseModel):
    task_name: str
    location: str
    difficulty: str
    description: str

@app.get("/tasks")
def get_tasks(db: Session = Depends(get_db)):
    """Fetch all available tasks from the database."""
    # Ensure default tasks exist if the database is brand new
    seed_default_tasks(db)
    tasks = db.query(models.TaskDictionary).all()
    return tasks

@app.get("/tasks/{host_id}")
def get_tasks(host_id: int, db: Session = Depends(get_db)):
    """Fetch tasks specific to this host."""
    tasks = db.query(models.TaskDictionary).filter(models.TaskDictionary.host_id == host_id).all()
    return tasks

@app.post("/tasks")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Add a new custom task for this host."""
    new_task = models.TaskDictionary(
        host_id=task.host_id,
        task_name=task.task_name,
        location=task.location,
        difficulty=task.difficulty,
        description=task.description
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Remove a task from the master list."""
    task = db.query(models.TaskDictionary).filter(models.TaskDictionary.id == task_id).first()
    if task:
        db.delete(task)
        db.commit()
    return {"status": "deleted"}

@app.put("/tasks/{task_id}")
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    """Update an existing custom task."""
    task = db.query(models.TaskDictionary).filter(models.TaskDictionary.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.task_name = task_update.task_name
    task.location = task_update.location
    task.difficulty = task_update.difficulty
    task.description = task_update.description
    
    db.commit()
    db.refresh(task)
    return task

class HostConfig(BaseModel):
    host_id: int
    imposter_count: int
    cooldown_sec: int
    discussion_time_sec: int
    voting_time_sec: int

@app.post("/host")
def create_game(config: HostConfig, db: Session = Depends(get_db)):
    new_code = generate_room_code()
    while db.query(models.GameSession).filter(models.GameSession.room_code == new_code).first():
        new_code = generate_room_code()

    new_game = models.GameSession(
        room_code=new_code, 
        host_id=config.host_id, # <-- Save the host_id to the session
        current_phase="Lobby",
        imposter_count=config.imposter_count,
        cooldown_sec=config.cooldown_sec,
        discussion_time_sec=config.discussion_time_sec,
        voting_time_sec=config.voting_time_sec
    )
    db.add(new_game)
    db.commit()
    return {"room_code": new_code, "status": "Lobby Created"}

manager = ConnectionManager()

@app.websocket("/ws/{room_code}/{alias}")
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

           # --- PHASE 1: ALERT EVERYONE ---
            if action == "trigger_emergency":
                db = SessionLocal()
                try:
                    manager.meeting_acks[room_code] = set()
                    
                    # Get the exact count of alive players
                    alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).count()
                    
                    await manager.broadcast(room_code, {
                        "event": "emergency_alert", 
                        "caller": alias,
                        "total_alive": alive_players 
                    })
                finally:
                    db.close()
            
            # --- PHASE 2: GATHERING & DISCUSSION ---
            elif action == "acknowledge_meeting":
                db = SessionLocal()
                try:
                    alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).all()
                    alive_aliases = {p.alias for p in alive_players}
                    
                    if room_code not in manager.meeting_acks:
                        manager.meeting_acks[room_code] = set()
                        
                    # Add this player to the acknowledged list
                    manager.meeting_acks[room_code].add(alias)
                    
                    # Update everyone on the progress (e.g., "5/8 Agents En Route")
                    await manager.broadcast(room_code, {
                        "event": "ack_update",
                        "acks": len(manager.meeting_acks[room_code]),
                        "total": len(alive_aliases)
                    })
                    
                    # If everyone alive has acknowledged, move to Discussion!
                    if manager.meeting_acks[room_code].issuperset(alive_aliases):
                        game = db.query(models.GameSession).filter_by(room_code=room_code).first()
                        await manager.broadcast(room_code, {
                            "event": "discussion_started",
                            "discussion_time": game.discussion_time_sec if game else 60
                        })
                finally:
                    db.close()

            # --- PHASE 3: VOTING ---
            elif action == "start_voting":
                manager.active_votes[room_code] = {} 
                db = SessionLocal()
                try:
                    game = db.query(models.GameSession).filter_by(room_code=room_code).first()
                    
                    # NEW: Get only the players who are currently alive
                    alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).all()
                    alive_aliases = [p.alias for p in alive_players]
                    
                    await manager.broadcast(room_code, {
                        "event": "voting_started",
                        "voting_time": game.voting_time_sec if game else 60,
                        "eligible_targets": alive_aliases # <-- Send the alive list to the frontend
                    })
                finally:
                    db.close()
            
            # NEW: The Voting Logic with Ghost Fix and End Game Checks
            elif action == "submit_vote":
                target = payload.get("target")
                
                db = SessionLocal()
                try:
                    # GHOST FIX: Only count players who are actually alive in the DB
                    alive_players = db.query(models.Player).filter_by(room_code=room_code, is_alive=True).all()
                    alive_aliases = [p.alias for p in alive_players]
                    
                    if room_code not in manager.active_votes:
                        manager.active_votes[room_code] = {}
                        
                    # Only accept votes from alive players
                    if alias in alive_aliases:
                        manager.active_votes[room_code][alias] = target
                    
                    # Check if all ALIVE players have voted
                    if len(manager.active_votes[room_code]) == len(alive_aliases):
                        tally = {}
                        for vote in manager.active_votes[room_code].values():
                            tally[vote] = tally.get(vote, 0) + 1
                        
                        max_votes = max(tally.values())
                        leaders = [agent for agent, votes in tally.items() if votes == max_votes]
                        
                        eliminated_agent = "NO ONE"
                        if len(leaders) == 1 and leaders[0] != "SKIP":
                            eliminated_agent = leaders[0]
                            # Eliminate the player in the database
                            dead_player = db.query(models.Player).filter_by(room_code=room_code, alias=eliminated_agent).first()
                            if dead_player:
                                dead_player.is_alive = False
                                db.commit()
                        
                        # --- END GAME CHECK ---
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
                            
                        # Broadcast results, flagging if the game is over
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

            # Handling Task Completions & Task End Game
            elif action == "complete_task":
                task_id = payload.get("task_id")
                
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
                        
                    # Send progress update
                    await manager.broadcast(room_code, {
                        "event": "task_progress_update",
                        "progress": progress
                    })
                    
                    # --- END GAME CHECK ---
                    if progress == 100:
                        await manager.broadcast(room_code, {
                            "event": "game_over",
                            "winner": "Crewmates",
                            "reason": "All Mission Objectives Completed"
                        })
                finally:
                    db.close()
                    
                # Beam the new percentage to everyone (mostly for the Organizer)
                await manager.broadcast(room_code, {
                    "event": "task_progress_update",
                    "progress": progress
                })

            elif action == "report_neutralized":
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
                        # NEW: The game continues! Tell all phones to restart their cooldown timers.
                        await manager.broadcast(room_code, {
                            "event": "cooldown_reset",
                            "cooldown": 30
                        })
                finally:
                    db.close()

    except WebSocketDisconnect:
        manager.disconnect(room_code, alias)
        if room_code in manager.active_rooms:
            active_players = [p for p in manager.active_rooms[room_code].keys() if p != "ORGANIZER"]
            await manager.broadcast(room_code, {
                "event": "roster_update",
                "all_players": active_players
            })

def seed_default_tasks(db: Session):
    if db.query(models.TaskDictionary).count() == 0:
        default_tasks = [
            models.TaskDictionary(task_name="Pray for the retreat", location="Church Auditorium", difficulty="Easy", description="Find a quiet spot in the auditorium and pray for the speakers and attendees."),
            models.TaskDictionary(task_name="Organize Chairs", location="Fellowship Hall", difficulty="Medium", description="Make sure the first three rows of chairs are perfectly aligned."),
            models.TaskDictionary(task_name="Check Soundboard", location="AV Booth", difficulty="Hard", description="Verify all microphones are muted and the main output fader is set to 0dB."),
            models.TaskDictionary(task_name="Brew Coffee", location="Kitchen", difficulty="Easy", description="Ensure the coffee pots are full and the sugar packets are restocked."),
            models.TaskDictionary(task_name="Count Bibles", location="Sanctuary", difficulty="Medium", description="Count the Bibles in the back row to ensure there are exactly 15."),
            models.TaskDictionary(task_name="Wipe down tables", location="Cafeteria", difficulty="Easy", description="Use the sanitizing wipes to clean off the two main dining tables.")
        ]
        db.add_all(default_tasks)
        db.commit()

@app.post("/start/{room_code}")
async def start_game(room_code: str, db: Session = Depends(get_db)):
    seed_default_tasks(db)
    
    game = db.query(models.GameSession).filter_by(room_code=room_code).first()
    game.current_phase = "Playing"
    
    players = db.query(models.Player).filter_by(room_code=room_code).all()
    all_tasks = db.query(models.TaskDictionary).filter_by(host_id=game.host_id).all()
    
    # Group the available tasks by difficulty
    hard_tasks = [t for t in all_tasks if t.difficulty == "Hard"]
    med_tasks = [t for t in all_tasks if t.difficulty == "Medium"]
    easy_tasks = [t for t in all_tasks if t.difficulty == "Easy"]
    
    actual_imposter_count = min(game.imposter_count, max(1, len(players) - 1))
    imposters = random.sample(players, actual_imposter_count) if players else []
    imposter_ids = [imp.id for imp in imposters]
    
    # Fake ID generator for Imposter dummy tasks so the frontend React keys don't break
    dummy_id_counter = -1 

    for player in players:
        player_tasks_to_send = []
        
        assigned_hard = random.sample(hard_tasks, min(1, len(hard_tasks)))
        assigned_med = random.sample(med_tasks, min(2, len(med_tasks)))
        assigned_easy = random.sample(easy_tasks, min(3, len(easy_tasks)))
        
        assigned_tasks = assigned_hard + assigned_med + assigned_easy
        
        if player.id in imposter_ids:
            player.role = "Imposter"
            
            # Identify fellow imposters (excluding the current player)
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
                {
                    "event": "role_reveal", 
                    "role": player.role, 
                    "tasks": player_tasks_to_send,
                    "teammates": other_imposters # <-- Added to payload
                }, 
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
    
    # NEW: Broadcast the custom cooldown length stored in the database
    await manager.broadcast(room_code, {"event": "game_started", "cooldown": game.cooldown_sec})
    
    return {"status": "Game Started"}