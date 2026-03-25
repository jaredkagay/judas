from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Host(Base):
    __tablename__ = "hosts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)

    template = relationship("GameTemplate", back_populates="host", uselist=False)
    tasks = relationship("TaskDictionary", back_populates="host")

class GameTemplate(Base):
    """Stores the specific game settings for a single host."""
    __tablename__ = "game_templates"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("hosts.id"), unique=True)
    imposter_count = Column(Integer, default=1)
    cooldown_sec = Column(Integer, default=30)
    discussion_time_sec = Column(Integer, default=60)
    voting_time_sec = Column(Integer, default=30)

    host = relationship("Host", back_populates="template")

class TaskDictionary(Base):
    """The list of tasks. Now linked to a specific host."""
    __tablename__ = "task_dictionary"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("hosts.id")) # Links task to the host
    task_name = Column(String)  
    location = Column(String)   
    difficulty = Column(String) 
    description = Column(String)
    
    host = relationship("Host", back_populates="tasks")

class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String, unique=True, index=True)
    host_id = Column(Integer)
    current_phase = Column(String, default="Lobby")  
    is_active = Column(Boolean, default=True)
    imposter_count = Column(Integer, default=1)
    cooldown_sec = Column(Integer, default=30)
    discussion_time_sec = Column(Integer, default=60)
    voting_time_sec = Column(Integer, default=30)

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String, index=True)
    alias = Column(String)
    role = Column(String, nullable=True)  
    is_alive = Column(Boolean, default=True)

class PlayerTask(Base):
    __tablename__ = "player_tasks"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String, index=True)
    player_alias = Column(String, index=True) 
    task_name = Column(String)
    location = Column(String)
    difficulty = Column(String)
    description = Column(String)
    is_completed = Column(Boolean, default=False)