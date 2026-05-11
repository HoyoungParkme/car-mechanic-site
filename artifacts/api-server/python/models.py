from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, Date, DateTime, ForeignKey
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    oauth_provider = Column(String(20), nullable=False)
    oauth_id = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    profile_image = Column(Text, nullable=True)
    is_admin = Column(Boolean, default=False)
    username = Column(String(50), nullable=True, unique=True)
    password_hash = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PhoneOTP(Base):
    __tablename__ = "phone_otps"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    is_verified = Column(Boolean, default=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    time_slot = Column(String(10), nullable=False)
    service_type = Column(String(100), nullable=False)
    vehicle_model = Column(String(100), nullable=True)
    vehicle_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    rejection_reason = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)
    kakao_notified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(Text, nullable=False)
    caption = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class ExpertiseItem(Base):
    __tablename__ = "expertise_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon_name = Column(String(50), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class ShopInfo(Base):
    __tablename__ = "shop_info"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(Text, nullable=True)
