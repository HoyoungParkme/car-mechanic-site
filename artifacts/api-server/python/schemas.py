from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    email: Optional[str]
    name: str
    profile_image: Optional[str]
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReservationCreate(BaseModel):
    date: date
    time_slot: str
    service_type: str
    vehicle_model: Optional[str] = None
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None


class ReservationUpdate(BaseModel):
    status: Optional[str] = None
    date: Optional[date] = None
    time_slot: Optional[str] = None
    service_type: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    is_completed: Optional[bool] = None
    is_paid: Optional[bool] = None
    kakao_notified: Optional[bool] = None


class ReservationOut(BaseModel):
    id: int
    user_id: int
    date: date
    time_slot: str
    service_type: str
    vehicle_model: Optional[str]
    vehicle_number: Optional[str]
    notes: Optional[str]
    status: str
    rejection_reason: Optional[str] = None
    is_completed: bool = False
    is_paid: bool = False
    kakao_notified: bool = False
    created_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    model_config = {"from_attributes": True}


class PhotoCreate(BaseModel):
    url: str
    caption: Optional[str] = None
    sort_order: int = 0


class PhotoOut(BaseModel):
    id: int
    url: str
    caption: Optional[str]
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ExpertiseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    icon_name: Optional[str] = None
    sort_order: int = 0


class ExpertiseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    icon_name: Optional[str] = None
    sort_order: Optional[int] = None


class ExpertiseOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    icon_name: Optional[str]
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ShopInfoItem(BaseModel):
    key: str
    value: Optional[str]


class ShopInfoBulkUpdate(BaseModel):
    items: list[ShopInfoItem]


class UploadUrlRequest(BaseModel):
    name: str
    size: int
    content_type: str


class UploadUrlResponse(BaseModel):
    upload_url: str
    object_path: str
