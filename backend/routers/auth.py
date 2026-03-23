from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import hashlib

from database import get_db
import models
import schemas

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/register")
def register_host(auth: schemas.HostAuth, db: Session = Depends(get_db)):
    existing_host = db.query(models.Host).filter(models.Host.username == auth.username).first()
    if existing_host:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    new_host = models.Host(
        username=auth.username,
        password_hash=hash_password(auth.password)
    )
    db.add(new_host)
    db.commit()
    db.refresh(new_host)

    default_template = models.GameTemplate(
        host_id=new_host.id,
        imposter_count=1,
        cooldown_sec=30
    )
    db.add(default_template)
    db.commit()

    return {"host_id": new_host.id, "username": new_host.username}

@router.post("/login")
def login_host(auth: schemas.HostAuth, db: Session = Depends(get_db)):
    host = db.query(models.Host).filter(models.Host.username == auth.username).first()
    if not host or host.password_hash != hash_password(auth.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {"host_id": host.id, "username": host.username}