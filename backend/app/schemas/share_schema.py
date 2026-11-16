from typing import Optional
from pydantic import BaseModel
from pydantic import EmailStr


class ShareFileSchema(BaseModel):
    file_id: Optional[int] = None
    folder_id: Optional[int] = None
    shared_with_user_id: Optional[int] = None
    shared_with_email: Optional[EmailStr] = None
    permission: str
