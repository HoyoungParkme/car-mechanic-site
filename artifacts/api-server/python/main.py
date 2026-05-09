import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import auth, reservations, photos, expertise, shop_info, storage

app = FastAPI(title="드림모터스 API", version="1.0.0")

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
