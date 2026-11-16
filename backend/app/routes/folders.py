from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Folder
from app.db.models import File
from app.db.models import Share
from app.schemas.folder_schema import CreateFolderSchema
from app.schemas.folder_schema import MoveFolderSchema
from app.schemas.folder_schema import RenameFolderSchema

from app.utils.dependencies import get_current_user
from app.utils.permissions import has_folder_access as get_inherited_share

router = APIRouter(
    prefix="/folders",
    tags=["Folders"]
)

@router.post("/")
def create_folder(
    data: CreateFolderSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    owner_id = current_user.id

    if data.parent_id:

        parent_folder = db.query(Folder).filter(
            Folder.id == data.parent_id,
            Folder.is_deleted == False
        ).first()

        if not parent_folder:
            raise HTTPException(
                status_code=404,
                detail="Parent folder not found"
            )

        if parent_folder.owner_id != current_user.id:

            share = get_inherited_share(
                db=db,
                folder_id=data.parent_id,
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

            owner_id = parent_folder.owner_id

    new_folder = Folder(
        name=data.name,
        owner_id=owner_id,
        parent_id=data.parent_id
    )

    db.add(new_folder)

    db.commit()

    db.refresh(new_folder)

    return new_folder

@router.get("/")
def get_all_folders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    folders = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.is_deleted == False
    ).all()

    result = []

    for folder in folders:
        result.append({
            "id": folder.id,
            "name": folder.name,
            "parent_id": folder.parent_id,
            "owner_id": folder.owner_id,
            "is_deleted": folder.is_deleted
        })

    return result


def _collect_descendant_folders(db, root_id: int):

    result = []
    stack = [root_id]
    seen = set()

    while stack:
        current_id = stack.pop()
        if current_id in seen:
            continue
        seen.add(current_id)

        children = db.query(Folder).filter(
            Folder.parent_id == current_id,
            Folder.is_deleted == False
        ).all()

        for child in children:
            result.append(child)
            stack.append(child.id)

    return result


@router.get("/accessible")
def get_accessible_folders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    owned = db.query(Folder).filter(
        Folder.owner_id == current_user.id,
        Folder.is_deleted == False
    ).all()

    shared_roots = db.query(Folder).join(
        Share,
        Share.folder_id == Folder.id
    ).filter(
        Share.shared_with_user_id == current_user.id,
        Folder.is_deleted == False
    ).all()

    folders = []
    by_id = {}

    for f in owned:
        by_id[f.id] = f

    for root in shared_roots:
        by_id[root.id] = root
        for child in _collect_descendant_folders(db, root.id):
            by_id[child.id] = child

    for f in by_id.values():
        share = get_inherited_share(db=db, folder_id=f.id, user_id=current_user.id)
        perm = "owner" if f.owner_id == current_user.id else (share.permission if share else "viewer")
        folders.append({
            "id": f.id,
            "name": f.name,
            "parent_id": f.parent_id,
            "owner_id": f.owner_id,
            "permission": perm
        })

    return folders

@router.get("/{folder_id}")
def get_folder_contents(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # Owner check
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.is_deleted == False
    ).first()

    if not folder:
        raise HTTPException(
            status_code=404,
            detail="Folder not found"
        )

    access = "owner"
    permission = "owner"

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

        access = "shared"
        permission = share.permission

    child_folders = db.query(Folder).filter(
        Folder.parent_id == folder_id,
        Folder.is_deleted == False
    ).all()

    files = db.query(File).filter(
        File.folder_id == folder_id,
        File.is_deleted == False
    ).all()

    return {
        "folder": folder,
        "access": access,
        "permission": permission,
        "folders": child_folders,
        "files": files
    }


def _is_descendant(db, folder_id: int, potential_parent_id: int) -> bool:

    current = db.query(Folder).filter(
        Folder.id == potential_parent_id,
        Folder.is_deleted == False
    ).first()

    seen = set()

    while current and current.parent_id:

        if current.id in seen:
            break
        seen.add(current.id)

        if current.parent_id == folder_id:
            return True

        current = db.query(Folder).filter(
            Folder.id == current.parent_id,
            Folder.is_deleted == False
        ).first()

    return False


@router.put("/{folder_id}/move")
def move_folder(
    folder_id: int,
    data: MoveFolderSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.is_deleted == False
    ).first()

    if not folder:
        raise HTTPException(
            status_code=404,
            detail="Folder not found"
        )

    # Permission on the folder being moved
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

    # Move to root only by owner
    if data.parent_id is None:
        if folder.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the owner can move to root"
            )

        folder.parent_id = None
        db.commit()
        return {"message": "Folder moved to root successfully"}

    if data.parent_id == folder_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid destination"
        )

    if _is_descendant(db, folder_id=folder_id, potential_parent_id=data.parent_id):
        raise HTTPException(
            status_code=400,
            detail="Cannot move a folder into its descendant"
        )

    target = db.query(Folder).filter(
        Folder.id == data.parent_id,
        Folder.is_deleted == False
    ).first()

    if not target:
        raise HTTPException(
            status_code=404,
            detail="Target folder not found"
        )

    if target.owner_id != current_user.id:
        share = get_inherited_share(
            db=db,
            folder_id=data.parent_id,
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

    folder.parent_id = data.parent_id
    db.commit()

    return {"message": "Folder moved successfully", "parent_id": folder.parent_id}


@router.put("/{folder_id}/rename")
def rename_folder(
    folder_id: int,
    data: RenameFolderSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

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

    folder.name = data.new_name
    db.commit()

    return {"message": "Folder renamed successfully", "new_name": folder.name}
