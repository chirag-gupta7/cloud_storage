from typing import Optional
from pydantic import BaseModel


class ToggleStarSchema(BaseModel):

    file_id: Optional[int] = None
    folder_id: Optional[int] = None

