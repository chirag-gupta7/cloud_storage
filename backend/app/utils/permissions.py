from fastapi import HTTPException

from app.db.models import File
from app.db.models import Share
from app.db.models import Folder

def has_folder_access(db, folder_id, user_id):

    current_folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.is_deleted == False
    ).first()

    while current_folder:

        share = db.query(Share).filter(
            Share.folder_id == current_folder.id,
            Share.shared_with_user_id == user_id
        ).first()

        if share:
            return share

        if not current_folder.parent_id:
            break

        current_folder = db.query(Folder).filter(
            Folder.id == current_folder.parent_id,
            Folder.is_deleted == False
        ).first()

    return None

def check_file_permission(
    db,
    file_id,
    user_id,
    required_permission="viewer"
):

    file = db.query(File).filter(
        File.id == file_id,
        File.is_deleted == False
    ).first()

    if not file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    # Owner access
    if file.owner_id == user_id:
        return file

    # Direct file share
    share = db.query(Share).filter(
        Share.file_id == file_id,
        Share.shared_with_user_id == user_id
    ).first()

    if share:

        if required_permission == "editor":
            if share.permission != "editor":
                raise HTTPException(
                    status_code=403,
                    detail="Editor permission required"
                )

        return file

    # Folder inherited share
    if file.folder_id:
        folder_share = has_folder_access(
            db=db,
            folder_id=file.folder_id,
            user_id=user_id
        )

        if folder_share:

            if required_permission == "editor":
                if folder_share.permission != "editor":
                    raise HTTPException(
                        status_code=403,
                        detail="Editor permission required"
                    )

            return file

    raise HTTPException(
        status_code=403,
        detail="Access denied"
    )
