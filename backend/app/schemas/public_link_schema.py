from pydantic import BaseModel
from typing import Optional


class CreatePublicLinkSchema(BaseModel):

    file_id: int
    password: Optional[str] = None
    expires_in_hours: Optional[int] = None