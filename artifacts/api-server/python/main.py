import os
from contextlib import asynccontextmanager
from datetime import date as date_type
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from database import engine, SessionLocal
from models import Base, Reservation, User
from routers import auth, reservations, photos, expertise, shop_info, storage


def run_migrations():
    """Add new columns to existing tables without dropping data."""
    new_columns = [
        "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS rejection_reason TEXT",
        "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE",
        "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE",
        "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS kakao_notified BOOLEAN DEFAULT FALSE",
    ]
    with engine.connect() as conn:
        for stmt in new_columns:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass
        conn.commit()


def seed_demo_reservations():
    """Seed demo reservations if none exist."""
    db = SessionLocal()
    try:
        if db.query(Reservation).count() > 0:
            return
        admin = db.query(User).filter(User.oauth_provider == "local", User.oauth_id == "admin").first()
        if not admin:
            return
        demos = [
            Reservation(user_id=admin.id, date=date_type(2026, 5, 19), time_slot="10:00", service_type="엔진오일 교환", vehicle_model="쏘나타 DN8", vehicle_number="12가 3456", notes="주행 거리 15만km, 합성유 요청", status="pending"),
            Reservation(user_id=admin.id, date=date_type(2026, 5, 19), time_slot="10:00", service_type="브레이크 점검", vehicle_model="아반떼 CN7", vehicle_number="78나 9012", notes="제동 시 소음 발생", status="pending"),
            Reservation(user_id=admin.id, date=date_type(2026, 5, 20), time_slot="14:00", service_type="타이어 교환", vehicle_model="그랜저 IG", vehicle_number="34다 5678", notes="4본 교환 희망", status="confirmed"),
            Reservation(user_id=admin.id, date=date_type(2026, 5, 21), time_slot="11:00", service_type="배터리 교체", vehicle_model="K5 3세대", vehicle_number="56라 7890", notes=None, status="confirmed", is_completed=True, is_paid=True, kakao_notified=True),
            Reservation(user_id=admin.id, date=date_type(2026, 5, 22), time_slot="09:00", service_type="종합 정밀진단", vehicle_model="팰리세이드", vehicle_number="90마 1234", notes="구매 전 점검", status="rejected", rejection_reason="해당 일정 이미 만차"),
            Reservation(user_id=admin.id, date=date_type(2026, 5, 23), time_slot="15:00", service_type="에어컨 점검", vehicle_model="카니발 KA4", vehicle_number="11바 2233", notes=None, status="confirmed", is_completed=True, is_paid=False, kakao_notified=True),
        ]
        for d in demos:
            db.add(d)
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    seed_demo_reservations()
    yield


app = FastAPI(title="드림모터스 API", version="1.0.0", lifespan=lifespan)

REPLIT_DOMAINS = os.getenv("REPLIT_DOMAINS", "")
origins = ["http://localhost", "http://localhost:80"]
if REPLIT_DOMAINS:
    for domain in REPLIT_DOMAINS.split(","):
        domain = domain.strip()
        origins.append(f"https://{domain}")
        origins.append(f"http://{domain}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(photos.router)
app.include_router(expertise.router)
app.include_router(shop_info.router)
app.include_router(storage.router)


@app.get("/api/healthz")
def healthz():
    return JSONResponse({"status": "ok"})


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
