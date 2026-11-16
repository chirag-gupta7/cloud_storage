from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.db.models import File
from app.db.models import Share
from app.db.models import User
from app.db.models import Folder

from app.schemas.share_schema import ShareFileSchema

from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/shares",
    tags=["Shares"]
)


@router.get("/by-me")
def get_items_shared_by_me(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    shares = db.query(Share).all()

    result = []

    for share in shares:

        shared_with = db.query(User).filter(
            User.id == share.shared_with_user_id
        ).first()

        if share.file_id:
            file = db.query(File).filter(
                File.id == share.file_id,
                File.owner_id == current_user.id,
                File.is_deleted == False
            ).first()

            if file and shared_with:
                result.append({
                    "share_id": share.id,
                    "type": "file",
                    "id": file.id,
                    "name": file.name,
                    "mime_type": file.mime_type,
                    "size": file.size,
                    "permission": share.permission,
                    "shared_with_user_id": shared_with.id,
                    "shared_with_email": shared_with.email
                })

        if share.folder_id:
            folder = db.query(Folder).filter(
                Folder.id == share.folder_id,
                Folder.owner_id == current_user.id,
                Folder.is_deleted == False
            ).first()

            if folder and shared_with:
                result.append({
                    "share_id": share.id,
                    "type": "folder",
                    "id": folder.id,
                    "name": folder.name,
                    "permission": share.permission,
                    "shared_with_user_id": shared_with.id,
                    "shared_with_email": shared_with.email
                })

    return result


@router.delete("/{share_id}")
def revoke_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    share = db.query(Share).filter(
        Share.id == share_id
    ).first()

    if not share:
        raise HTTPException(
            status_code=404,
            detail="Share not found"
        )

    if share.file_id:
        file = db.query(File).filter(
            File.id == share.file_id
        ).first()
        if not file or file.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

    if share.folder_id:
        folder = db.query(Folder).filter(
            Folder.id == share.folder_id
        ).first()
        if not folder or folder.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

    db.delete(share)
    db.commit()

    return {
        "message": "Share revoked"
    }

def get_folder_contents_recursive(db, folder_id):

    child_folders = db.query(Folder).filter(
        Folder.parent_id == folder_id,
        Folder.is_deleted == False
    ).all()

    files = db.query(File).filter(
        File.folder_id == folder_id,
        File.is_deleted == False
    ).all()

    folder_data = []

    for folder in child_folders:

        nested = get_folder_contents_recursive(
            db,
            folder.id
        )

        folder_data.append({
            "id": folder.id,
            "name": folder.name,
            "folders": nested["folders"],
            "files": nested["files"]
        })

    file_data = []

    for file in files:
        file_data.append({
            "id": file.id,
            "name": file.name,
            "mime_type": file.mime_type,
            "size": file.size
        })

    return {
        "folders": folder_data,
        "files": file_data
    }

@router.post("/")
def share_file(
    data: ShareFileSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if data.permission not in ["viewer", "editor"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid permission"
        )

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

    if not data.shared_with_user_id and not data.shared_with_email:
        raise HTTPException(
            status_code=400,
            detail="Provide shared_with_user_id or shared_with_email"
        )

    if data.shared_with_user_id and data.shared_with_email:
        raise HTTPException(
            status_code=400,
            detail="Provide only one: shared_with_user_id OR shared_with_email"
        )

    if data.shared_with_email:
        target_user = db.query(User).filter(
            User.email == data.shared_with_email
        ).first()
    else:
        target_user = db.query(User).filter(
            User.id == data.shared_with_user_id
        ).first()

    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="Target user not found"
        )

    # FILE SHARING
    if data.file_id:

        file = db.query(File).filter(
            File.id == data.file_id,
            File.owner_id == current_user.id,
            File.is_deleted == False
        ).first()

        if not file:
            raise HTTPException(
                status_code=404,
                detail="File not found"
            )

        existing_share = db.query(Share).filter(
            Share.file_id == data.file_id,
            Share.shared_with_user_id == target_user.id
        ).first()

        if existing_share:
            existing_share.permission = data.permission
            db.commit()

            return {
                "message": "File permission updated"
            }

        share = Share(
            file_id=data.file_id,
            folder_id=None,
            shared_with_user_id=target_user.id,
            permission=data.permission
        )

        db.add(share)
        db.commit()

        return {
            "message": "File shared successfully"
        }

    # FOLDER SHARING
    if data.folder_id:

        folder = db.query(Folder).filter(
            Folder.id == data.folder_id,
            Folder.owner_id == current_user.id,
            Folder.is_deleted == False
        ).first()

        if not folder:
            raise HTTPException(
                status_code=404,
                detail="Folder not found"
            )

        existing_share = db.query(Share).filter(
            Share.folder_id == data.folder_id,
            Share.shared_with_user_id == target_user.id
        ).first()

        if existing_share:
            existing_share.permission = data.permission
            db.commit()

            return {
                "message": "Folder permission updated"
            }

        share = Share(
            file_id=None,
            folder_id=data.folder_id,
            shared_with_user_id=target_user.id,
            permission=data.permission
        )

        db.add(share)
        db.commit()

        return {
            "message": "Folder shared successfully"
        }    

@router.get("/me")
def get_shared_items(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    shares = db.query(Share).filter(
        Share.shared_with_user_id == current_user.id
    ).all()

    result = []

    for share in shares:

        # Shared file
        if share.file_id:

            file = db.query(File).filter(
                File.id == share.file_id,
                File.is_deleted == False
            ).first()

            if file:
                result.append({
                    "type": "file",
                    "id": file.id,
                    "name": file.name,
                    "mime_type": file.mime_type,
                    "size": file.size,
                    "permission": share.permission
                })

        # Shared folder
        if share.folder_id:

            folder = db.query(Folder).filter(
                Folder.id == share.folder_id,
                Folder.is_deleted == False
            ).first()

            if folder:

                contents = get_folder_contents_recursive(
                    db,
                    folder.id
                )

                result.append({
                    "type": "folder",
                    "id": folder.id,
                    "name": folder.name,
                    "permission": share.permission,
                    "folders": contents["folders"],
                    "files": contents["files"]
                })

    return result
