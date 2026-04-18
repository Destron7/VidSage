from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import Base

# SQLite database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./vidsage.db"

# Create the engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a session factory
sessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)

# Create all tables
Base.metadata.create_all(bind=engine)


def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()