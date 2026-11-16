import uuid

from datetime import datetime
from datetime import timedelta

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.db.models import File
from app.db.models import PublicLink

from app.schemas.public_link_schema import CreatePublicLinkSchema

from app.utils.dependencies import get_current_user

from app.services.supabase_service import supabase

from app.core.config import SUPABASE_BUCKET

router = APIRouter(
    prefix="/public",
    tags=["Public Links"]
)


@router.post("/")
def create_public_link(
    data: CreatePublicLinkSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

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

    token = str(uuid.uuid4())

    expires_at = None

    if data.expires_in_hours:

        expires_at = datetime.utcnow() + timedelta(
            hours=data.expires_in_hours
        )

    public_link = PublicLink(
        token=token,
        file_id=data.file_id,
        password=data.password,
        expires_at=expires_at
    )

    db.add(public_link)

    db.commit()

    return {
        "public_url": f"/public/{token}"
    }


@router.get("/{token}")
def access_public_file(
    token: str,
    password: str = None,
    db: Session = Depends(get_db)
):

    public_link = db.query(PublicLink).filter(
        PublicLink.token == token
    ).first()

    if not public_link:

        raise HTTPException(
            status_code=404,
            detail="Invalid public link"
        )

    if public_link.expires_at:

        if datetime.utcnow() > public_link.expires_at:

            raise HTTPException(
                status_code=403,
                detail="Link expired"
            )

    if public_link.password:

        if password != public_link.password:

            raise HTTPException(
                status_code=403,
                detail="Incorrect password"
            )

    file = db.query(File).filter(
        File.id == public_link.file_id,
        File.is_deleted == False
    ).first()

    if not file:

        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    response = supabase.storage \
        .from_(SUPABASE_BUCKET) \
        .create_signed_url(
            file.storage_path,
            3600,
            {
                "download": file.name
            }
        )

    return {
        "download_url": response["signedURL"]
    }

@router.get("/{token}/preview")
def preview_public_file(
    token: str,
    password: str = None,
    db: Session = Depends(get_db)
):

    public_link = db.query(PublicLink).filter(
        PublicLink.token == token
    ).first()

    if not public_link:

        raise HTTPException(
            status_code=404,
            detail="Invalid public link"
        )

    if public_link.expires_at:

        if datetime.utcnow() > public_link.expires_at:

            raise HTTPException(
                status_code=403,
                detail="Link expired"
            )

    if public_link.password:

        if password != public_link.password:

            raise HTTPException(
                status_code=403,
                detail="Incorrect password"
            )

    file = db.query(File).filter(
        File.id == public_link.file_id,
        File.is_deleted == False
    ).first()

    if not file:

        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

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