import uuid

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.services.supabase_service import supabase
from app.db.database import get_db
from app.core.config import SUPABASE_BUCKET
from app.db.models import File
from app.db.models import Folder
from fastapi import Query
from app.utils.permissions import check_file_permission
from app.utils.permissions import has_folder_access as get_inherited_share
from app.schemas.file_schema import InitUploadSchema
from app.schemas.file_schema import RenameFileSchema
from app.schemas.file_schema import MoveFileSchema
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)

@router.get("/")
def get_files(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    files = db.query(File).filter(
        File.owner_id == current_user.id,
        File.is_deleted == False
    ).all()

    return files

@router.get("/trash/list")
def get_trash_files(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    files = db.query(File).filter(
        File.owner_id == current_user.id,
        File.is_deleted == True
    ).all()

    return files

@router.get("/search")
def search_files(
    q: str = Query(...),
    mime_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    query = db.query(File).filter(
        File.owner_id == current_user.id,
        File.is_deleted == False,
        File.name.ilike(f"%{q}%")
    )

    if mime_type:
        query = query.filter(
            File.mime_type == mime_type
        )

    files = query.all()

    return files

@router.post("/{file_id}/restore")
def restore_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id,
        File.is_deleted == True
    ).first()

    if not file:

        raise HTTPException(
            status_code=404,
            detail="File not found in trash"
        )

    file.is_deleted = False

    db.commit()

    return {
        "message": "File restored"
    }

@router.delete("/{file_id}")
def move_to_trash(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    file = check_file_permission(
        db=db,
        file_id=file_id,
        user_id=current_user.id,
        required_permission="editor"
    )

    file.is_deleted = True

    db.commit()

    return {
        "message": "File moved to trash"
    }

@router.delete("/{file_id}/permanent")
def permanently_delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    file = check_file_permission(
        db=db,
        file_id=file_id,
        user_id=current_user.id,
        required_permission="editor"
    )

    try:

        supabase.storage \
            .from_(SUPABASE_BUCKET) \
            .remove([file.storage_path])

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Storage delete failed: {str(e)}"
        )

    db.delete(file)

    db.commit()

    return {
        "message": "File permanently deleted"
    }


@router.post("/init-upload")
def init_upload(
    data: InitUploadSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    unique_filename = (
        f"{uuid.uuid4()}-{data.filename}"
    )

    storage_path = (
        f"user-{current_user.id}/{unique_filename}"
    )

    file = File(
        name=data.filename,
        storage_path=storage_path,
        mime_type=data.mime_type,
        size=data.size,
        owner_id=current_user.id
    )

    db.add(file)

    db.commit()

    return {
        "storage_path": storage_path
    }
    

@router.get("/{file_id}/preview")
def preview_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    file = check_file_permission(
        db=db,
        file_id=file_id,
        user_id=current_user.id,
        required_permission="viewer"
    )

    try:

        response = supabase.storage \
            .from_(SUPABASE_BUCKET) \
            .create_signed_url(
                file.storage_path,
                3600,
                {
                    "download": False
                }
            )

        return {
            "preview_url": response["signedURL"]
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
        
@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    file = check_file_permission(
        db=db,
        file_id=file_id,
        user_id=current_user.id,
        required_permission="viewer"
    )

    if not file:

        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    try:
        response = supabase.storage \
            .from_(SUPABASE_BUCKET) \
            .create_signed_url(
                file.storage_path,
                7200,
                {
                    "download": file.name
                }
            )

        return {
            "download_url": response["signedURL"]
        }
    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
        
@router.put("/{file_id}/rename")
def rename_file(
    file_id: int,
    data: RenameFileSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    file = check_file_permission(
        db=db,
        file_id=file_id,
        user_id=current_user.id,
        required_permission="editor"
    )

    file.name = data.new_name

    db.commit()

    return {
        "message": "File renamed successfully",
        "new_name": file.name
    }
    
@router.put("/{file_id}/move")
def move_file(
    file_id: int,
    data: MoveFileSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    file = check_file_permission(
        db=db,
        file_id=file_id,
        user_id=current_user.id,
        required_permission="editor"
    )

    # Move to root (only owner)
    if data.folder_id is None:
        if file.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can move to root"
            )

        file.folder_id = None
        db.commit()

        return {"message": "File moved to root successfully"}

    # Check target folder exists
    target_folder = db.query(Folder).filter(
        Folder.id == data.folder_id,
        Folder.is_deleted == False
    ).first()

    if not target_folder:
        raise HTTPException(
            status_code=404,
            detail="Target folder not found"
        )

    if target_folder.owner_id != current_user.id:

        share = get_inherited_share(
            db=db,
            folder_id=data.folder_id,
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

    file.folder_id = data.folder_id

    db.commit()

    return {
        "message": "File moved successfully",
        "folder_id": file.folder_id
    }
