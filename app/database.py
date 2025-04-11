# database.py - Updated with proper PostgreSQL connection

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

# Get PostgreSQL URI from environment variables
POSTGRES_URI = os.getenv("POSTGRES_URI")
if not POSTGRES_URI:
    raise ValueError("POSTGRES_URI environment variable not set. Please check your .env file.")

# Create engine with proper connection pooling parameters
engine = create_engine(
    POSTGRES_URI,
    pool_size=5,               # Number of connections to keep open
    max_overflow=10,           # Max extra connections to create
    pool_timeout=30,           # Seconds to wait for connection to become available
    pool_recycle=1800          # Recycle connections after 30 minutes
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Function to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()