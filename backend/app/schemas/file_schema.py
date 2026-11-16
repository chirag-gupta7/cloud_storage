from pydantic import BaseModel
from typing import Optional

class InitUploadSchema(BaseModel):

    filename: str
    mime_type: str
    size: int
    
class RenameFileSchema(BaseModel):
    new_name: str
    
class MoveFileSchema(BaseModel):
    folder_id: Optional[int] = None
