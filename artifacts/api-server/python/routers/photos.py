from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Photo
from schemas import PhotoCreate, PhotoOut
from auth import get_admin_user, get_current_user_optional
from models import User
from typing import Optional

router = APIRouter(prefix="/api/photos", tags=["photos"])


@router.get("", response_model=list[PhotoOut])
def list_photos(db: Session = Depends(get_db)):
    return db.query(Photo).order_by(Photo.sort_order, Photo.created_at).all()


@router.post("", response_model=PhotoOut, status_code=201)
def create_photo(
    body: PhotoCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    photo = Photo(url=body.url, caption=body.caption, sort_order=body.sort_order)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/{photo_id}", status_code=204)
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다.")
    db.delete(photo)
    db.commit()
