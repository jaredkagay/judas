from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

# Prefix means we don't have to write /tasks in every route below
router = APIRouter(prefix="/tasks")

@router.get("")
@router.get("/")
def get_all_tasks(db: Session = Depends(get_db)):
    """Fetch all available tasks from the database."""
    tasks = db.query(models.TaskDictionary).all()
    return tasks

@router.get("/{host_id}")
def get_host_tasks(host_id: int, db: Session = Depends(get_db)):
    """Fetch tasks specific to this host."""
    tasks = db.query(models.TaskDictionary).filter(models.TaskDictionary.host_id == host_id).all()
    return tasks

@router.post("")
@router.post("/")
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
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

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Remove a task from the master list."""
    task = db.query(models.TaskDictionary).filter(models.TaskDictionary.id == task_id).first()
    if task:
        db.delete(task)
        db.commit()
    return {"status": "deleted"}

@router.put("/{task_id}")
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
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