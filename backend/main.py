from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models

# Import your newly extracted routers
from routers import auth, template, tasks, game, websockets

# This line tells SQLAlchemy to create the tables in the among_us.db file
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the routers to the main app
app.include_router(auth.router)
app.include_router(template.router)
app.include_router(tasks.router)
app.include_router(game.router)
app.include_router(websockets.router)