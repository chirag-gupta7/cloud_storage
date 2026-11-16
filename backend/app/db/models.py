from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime
from sqlalchemy import Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Text
from app.db.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    files = relationship(
        "File",
        back_populates="owner"
    )

    folders = relationship(
        "Folder",
        back_populates="owner"
    )

class Folder(Base):

    __tablename__ = "folders"

    id = Column(Integer, primary_key=True)

    name = Column(String)

    owner_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    parent_id = Column(
        Integer,
        ForeignKey("folders.id"),
        nullable=True
    )

    is_deleted = Column(
        Boolean,
        default=False
    )

    owner = relationship(
        "User",
        back_populates="folders"
    )

    files = relationship(
        "File",
        back_populates="folder"
    )

class File(Base):

    __tablename__ = "files"

    id = Column(Integer, primary_key=True)

    name = Column(String)

    storage_path = Column(String)

    mime_type = Column(String)

    size = Column(Integer)

    owner_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    folder_id = Column(
        Integer,
        ForeignKey("folders.id"),
        nullable=True
    )

    is_deleted = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    owner = relationship(
        "User",
        back_populates="files"
    )

    folder = relationship(
        "Folder",
        back_populates="files"
    )

class Share(Base):

    __tablename__ = "shares"

    id = Column(Integer, primary_key=True)

    file_id = Column(
        Integer,
        ForeignKey("files.id"),
        nullable=True
    )

    folder_id = Column(
        Integer,
        ForeignKey("folders.id"),
        nullable=True
    )

    shared_with_user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    permission = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
class PublicLink(Base):

    __tablename__ = "public_links"

    id = Column(Integer, primary_key=True)

    token = Column(
        String,
        unique=True,
        nullable=False
    )

    file_id = Column(
        Integer,
        ForeignKey("files.id")
    )

    password = Column(
        String,
        nullable=True
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class Star(Base):

    __tablename__ = "stars"

    id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    file_id = Column(
        Integer,
        ForeignKey("files.id"),
        nullable=True
    )

    folder_id = Column(
        Integer,
        ForeignKey("folders.id"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
