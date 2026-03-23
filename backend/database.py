from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# This creates a file called "among_us.db" in your backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./among_us.db"

# `connect_args={"check_same_thread": False}` is required for SQLite in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# A helper function to open and close database connections per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()