from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Float, ForeignKey

class Base(DeclarativeBase):
    pass

class VideoDB(Base):
    # Name of Table in DB : videos
    __tablename__ = "videos"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=True)
    duration: Mapped[int] = mapped_column(Integer, nullable=True)
    filename: Mapped[str] = mapped_column(String, nullable=True)
    youtube_url: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")    
    transcription: Mapped[str] = mapped_column(String, nullable=True)
    summary: Mapped[str] = mapped_column(String, nullable=True)
    glossary: Mapped[str] = mapped_column(String, nullable=True)
    timed_segments: Mapped[str] = mapped_column(String, nullable=True)  # JSON: [{start, end, text}, ...]

class NoteDB(Base):
    __tablename__ = "notes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # This is the magic! We are linking this Note to a specific video's ID
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id"))
    
    # The actual text the user typed
    content: Mapped[str] = mapped_column(String)
    
    # Video playback timestamp (seconds) when the note was created
    timestamp: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
