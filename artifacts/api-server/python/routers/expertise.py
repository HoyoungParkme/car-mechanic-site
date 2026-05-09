from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ExpertiseItem, User
from schemas import ExpertiseCreate, ExpertiseUpdate, ExpertiseOut
from auth import get_admin_user

router = APIRouter(prefix="/api/expertise", tags=["expertise"])


@router.get("", response_model=list[ExpertiseOut])
def list_expertise(db: Session = Depends(get_db)):
    return db.query(ExpertiseItem).order_by(ExpertiseItem.sort_order).all()


@router.post("", response_model=ExpertiseOut, status_code=201)
def create_expertise(
    body: ExpertiseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    item = ExpertiseItem(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ExpertiseOut)
def update_expertise(
    item_id: int,
    body: ExpertiseUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    item = db.query(ExpertiseItem).filter(ExpertiseItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다.")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(item, field, val)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_expertise(
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    item = db.query(ExpertiseItem).filter(ExpertiseItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다.")
    db.delete(item)
    db.commit()
