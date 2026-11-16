import uuid

from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File as FastAPIFile
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from typing import Optional
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import File
from app.db.models import Folder
from app.services.supabase_service import supabase

from app.core.config import SUPABASE_BUCKET

from app.utils.dependencies import get_current_user
from app.utils.permissions import has_folder_access as get_inherited_share

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)

ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]


@router.post("/")
async def upload_file(
    folder_id: Optional[int] = Query(None),
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if file.content_type not in ALLOWED_TYPES:

        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )

    unique_filename = (
        f"{uuid.uuid4()}-{file.filename}"
    )

    storage_path = (
        f"user-{current_user.id}/{unique_filename}"
    )
    if folder_id:

        folder = db.query(Folder).filter(
            Folder.id == folder_id,
            Folder.is_deleted == False
        ).first()

        if not folder:

            raise HTTPException(
                status_code=404,
                detail="Folder not found"
            )

        if folder.owner_id != current_user.id:

            share = get_inherited_share(
                db=db,
                folder_id=folder_id,
                user_id=current_user.id
            )

            if not share:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied"
                )

            if share.permission != "editor":
                raise HTTPException(
                    status_code=403,
                    detail="Editor permission required"
                )
    content = await file.read()

    MAX_FILE_SIZE = 50 * 1024 * 1024

    if len(content) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=400,
            detail="File size exceeds 50MB limit"
        )

    try:

        response = supabase.storage \
            .from_(SUPABASE_BUCKET) \
            .upload(
                storage_path,
                content,
                {
                    "content-type": file.content_type,
                    "upsert": "true"
                }
            )

        print(response)

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    db_file = File(
        name=file.filename,
        storage_path=storage_path,
        mime_type=file.content_type,
        size=len(content),
        owner_id=folder.owner_id if folder_id else current_user.id,
        folder_id=folder_id
    )

    db.add(db_file)

    db.commit()

    return {
        "message": "Uploaded successfully",
        "path": storage_path
    }
