from pydantic import BaseModel
from typing import Optional


class CreateFolderSchema(BaseModel):

    name: str
    parent_id: Optional[int] = None


class MoveFolderSchema(BaseModel):

    parent_id: Optional[int] = None


class RenameFolderSchema(BaseModel):

    new_name: str
