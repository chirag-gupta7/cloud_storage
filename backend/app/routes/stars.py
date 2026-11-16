from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Star
from app.db.models import File
from app.db.models import Folder

from app.schemas.star_schema import ToggleStarSchema

from app.utils.dependencies import get_current_user
from app.utils.permissions import check_file_permission
from app.utils.permissions import has_folder_access

router = APIRouter(
    prefix="/stars",
    tags=["Stars"]
)


@router.get("/")
def get_my_stars(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    stars = db.query(Star).filter(
        Star.user_id == current_user.id
    ).all()

    file_ids = []
    folder_ids = []

    for s in stars:
        if s.file_id is not None:
            file_ids.append(s.file_id)
        if s.folder_id is not None:
            folder_ids.append(s.folder_id)

    return {
        "files": file_ids,
        "folders": folder_ids
    }


@router.post("/toggle")
def toggle_star(
    data: ToggleStarSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if not data.file_id and not data.folder_id:
        raise HTTPException(
            status_code=400,
            detail="Provide file_id or folder_id"
        )

    if data.file_id and data.folder_id:
        raise HTTPException(
            status_code=400,
            detail="Provide only one: file_id OR folder_id"
        )

    if data.file_id:
        check_file_permission(
            db=db,
            file_id=data.file_id,
            user_id=current_user.id,
            required_permission="viewer"
        )

        existing = db.query(Star).filter(
            Star.user_id == current_user.id,
            Star.file_id == data.file_id
        ).first()

        if existing:
            db.delete(existing)
            db.commit()
            return {"starred": False}

        s = Star(
            user_id=current_user.id,
            file_id=data.file_id,
            folder_id=None
        )
        db.add(s)
        db.commit()
        return {"starred": True}

    if data.folder_id:
        folder = db.query(Folder).filter(
            Folder.id == data.folder_id,
            Folder.is_deleted == False
        ).first()

        if not folder:
            raise HTTPException(
                status_code=404,
                detail="Folder not found"
            )

        if folder.owner_id != current_user.id:
            share = has_folder_access(
                db=db,
                folder_id=data.folder_id,
                user_id=current_user.id
            )

            if not share:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied"
                )

        existing = db.query(Star).filter(
            Star.user_id == current_user.id,
            Star.folder_id == data.folder_id
        ).first()

        if existing:
            db.delete(existing)
            db.commit()
            return {"starred": False}

        s = Star(
            user_id=current_user.id,
            file_id=None,
            folder_id=data.folder_id
        )
        db.add(s)
        db.commit()
        return {"starred": True}


@router.get("/items")
def get_starred_items(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    stars = db.query(Star).filter(
        Star.user_id == current_user.id
    ).all()

    result = []

    for s in stars:

        if s.file_id is not None:
            file = db.query(File).filter(
                File.id == s.file_id,
                File.is_deleted == False
            ).first()
            if file:
                # Ensure still accessible
                try:
                    check_file_permission(
                        db=db,
                        file_id=file.id,
                        user_id=current_user.id,
                        required_permission="viewer"
                    )
                except HTTPException:
                    continue

                result.append({
                    "type": "file",
                    "id": file.id,
                    "name": file.name,
                    "mime_type": file.mime_type,
                    "size": file.size
                })

        if s.folder_id is not None:
            folder = db.query(Folder).filter(
                Folder.id == s.folder_id,
                Folder.is_deleted == False
            ).first()
            if folder:
                if folder.owner_id != current_user.id:
                    share = has_folder_access(
                        db=db,
                        folder_id=folder.id,
                        user_id=current_user.id
                    )
                    if not share:
                        continue

                result.append({
                    "type": "folder",
                    "id": folder.id,
                    "name": folder.name
                })

    return result

