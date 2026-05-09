from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ShopInfo, User
from schemas import ShopInfoItem, ShopInfoBulkUpdate
from auth import get_admin_user

router = APIRouter(prefix="/api/shop-info", tags=["shop-info"])


@router.get("", response_model=list[ShopInfoItem])
def get_shop_info(db: Session = Depends(get_db)):
    rows = db.query(ShopInfo).all()
    return [ShopInfoItem(key=r.key, value=r.value) for r in rows]


@router.put("", response_model=list[ShopInfoItem])
def update_shop_info(
    body: ShopInfoBulkUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    for item in body.items:
        row = db.query(ShopInfo).filter(ShopInfo.key == item.key).first()
        if row:
            row.value = item.value
        else:
            db.add(ShopInfo(key=item.key, value=item.value))
    db.commit()
    rows = db.query(ShopInfo).all()
    return [ShopInfoItem(key=r.key, value=r.value) for r in rows]
