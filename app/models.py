# models.py - Fixed model definitions

from sqlalchemy import Column, String, Text, ForeignKey, DateTime, CheckConstraint, Integer, Float, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    chats = relationship("Chat", back_populates="user", cascade="all, delete")
    
    def __repr__(self):
        return f"<User {self.name}>"

class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete")
    
    def __repr__(self):
        return f"<Chat {self.title}>"

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id", ondelete="CASCADE"))
    sender = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    chat = relationship("Chat", back_populates="messages")
    
    __table_args__ = (
        CheckConstraint("sender IN ('user', 'bot')", name="sender_check"),
    )
    
    def __repr__(self):
        return f"<Message {self.id[:8]}... - {self.sender}>"

# New model for uploaded files
class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # csv, xlsx, etc.
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    rows_count = Column(Integer, nullable=True)
    columns = Column(JSONB, nullable=True)  # Store column names and types
    
    # Reference to the actual data table
    data_table_name = Column(String, nullable=False)
    
    user = relationship("User", back_populates="files")
    
    def __repr__(self):
        return f"<UploadedFile {self.filename}>"

# Add the relationship to User model
User.files = relationship("UploadedFile", back_populates="user", cascade="all, delete")