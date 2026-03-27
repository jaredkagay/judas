from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(prefix="/template")

@router.get("/{host_id}")
def get_template(host_id: int, db: Session = Depends(get_db)):
    template = db.query(models.GameTemplate).filter(models.GameTemplate.host_id == host_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.put("/{host_id}")
def update_template(host_id: int, config: schemas.TemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(models.GameTemplate).filter(models.GameTemplate.host_id == host_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.imposter_count = config.imposter_count
    template.cooldown_sec = config.cooldown_sec
    template.discussion_time_sec = config.discussion_time_sec
    template.voting_time_sec = config.voting_time_sec
    template.task_count_hard = config.task_count_hard
    template.task_count_medium = config.task_count_medium
    template.task_count_easy = config.task_count_easy
    
    db.commit()
    return template