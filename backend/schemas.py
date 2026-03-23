from pydantic import BaseModel

class HostAuth(BaseModel):
    username: str
    password: str

class TemplateUpdate(BaseModel):
    imposter_count: int
    cooldown_sec: int
    discussion_time_sec: int
    voting_time_sec: int

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

class HostConfig(BaseModel):
    host_id: int
    imposter_count: int
    cooldown_sec: int
    discussion_time_sec: int
    voting_time_sec: int