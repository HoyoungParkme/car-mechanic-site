import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from database import engine
from models import Base
from routers import auth, reservations, photos, expertise, shop_info, storage


def run_migrations():
    new_cols = [
        "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS rejection_reason TEXT",
        "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE",
        "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE",
        "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS kakao_notified BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
    ]
    with engine.connect() as conn:
        for stmt in new_cols:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass
        # unique index on username (ignore if exists)
        try:
            conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username) WHERE username IS NOT NULL"
            ))
        except Exception:
            pass
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    yield


app = FastAPI(title="드림모터스 API", version="1.0.0", lifespan=lifespan)

REPLIT_DOMAINS = os.getenv("REPLIT_DOMAINS", "")
origins = ["http://localhost", "http://localhost:80"]
if REPLIT_DOMAINS:
    for domain in REPLIT_DOMAINS.split(","):
        domain = domain.strip()
        origins += [f"https://{domain}", f"http://{domain}"]

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
