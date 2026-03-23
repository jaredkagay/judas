from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String, unique=True, index=True)
    current_phase = Column(String, default="Lobby")  # Lobby, Playing, EmergencyMeeting
    is_active = Column(Boolean, default=True)
    imposter_count = Column(Integer, default=1)
    cooldown_sec = Column(Integer, default=30)

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String, index=True)
    alias = Column(String)
    role = Column(String, nullable=True)  # Crewmate or Imposter
    is_alive = Column(Boolean, default=True)

class TaskDictionary(Base):
    """The master list of tasks the Organizer creates before the retreat."""
    __tablename__ = "task_dictionary"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String)  # e.g., "Pray"
    location = Column(String)   # e.g., "Church Auditorium"
    difficulty = Column(String) # "Easy", "Medium", "Hard"
    description = Column(String)

class PlayerTask(Base):
    """The specific instances of tasks assigned to players during a game."""
    __tablename__ = "player_tasks"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String, index=True)
    player_alias = Column(String, index=True) # Who is assigned this task
    task_name = Column(String)
    location = Column(String)
    description = Column(String)
    is_completed = Column(Boolean, default=False)