import os
import httpx
from fastapi import APIRouter, Depends, Response, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import create_access_token, get_current_user, get_current_user_optional
from schemas import UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
KAKAO_CLIENT_ID      = os.getenv("KAKAO_CLIENT_ID", "")
KAKAO_CLIENT_SECRET  = os.getenv("KAKAO_CLIENT_SECRET", "")
NAVER_CLIENT_ID      = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET  = os.getenv("NAVER_CLIENT_SECRET", "")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")

REPLIT_DOMAINS = os.getenv("REPLIT_DOMAINS", "localhost")
BASE_DOMAIN = REPLIT_DOMAINS.split(",")[0].strip()
BASE_URL = f"https://{BASE_DOMAIN}" if not BASE_DOMAIN.startswith("localhost") else "http://localhost:80"

COOKIE_SECURE = not BASE_DOMAIN.startswith("localhost")


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=30 * 24 * 3600,
        path="/",
    )


def get_or_create_user(db: Session, provider: str, oauth_id: str, email: str | None, name: str, profile_image: str | None = None, is_admin: bool = False) -> User:
    user = db.query(User).filter(User.oauth_provider == provider, User.oauth_id == oauth_id).first()
    if not user:
        user = User(oauth_provider=provider, oauth_id=oauth_id, email=email, name=name, profile_image=profile_image, is_admin=is_admin)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif is_admin and not user.is_admin:
        user.is_admin = True
        db.commit()
    return user


# ── Google ──────────────────────────────────────────────────────────────────

@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth가 설정되지 않았습니다. 관리자에게 문의하세요.")
    redirect_uri = f"{BASE_URL}/api/auth/google/callback"
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        "&response_type=code"
        f"&redirect_uri={redirect_uri}"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
    )
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth가 설정되지 않았습니다.")
    redirect_uri = f"{BASE_URL}/api/auth/google/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code, "client_id": GOOGLE_CLIENT_ID, "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri, "grant_type": "authorization_code",
        })
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Google 인증 실패")
        user_resp = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        u = user_resp.json()
    user = get_or_create_user(db, "google", str(u["id"]), u.get("email"), u.get("name", "사용자"), u.get("picture"))
    response = RedirectResponse(url="/")
    set_auth_cookie(response, create_access_token(user.id))
    return response


# ── Kakao ───────────────────────────────────────────────────────────────────

@router.get("/kakao")
def kakao_login():
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Kakao OAuth가 설정되지 않았습니다. 관리자에게 문의하세요.")
    redirect_uri = f"{BASE_URL}/api/auth/kakao/callback"
    url = f"https://kauth.kakao.com/oauth/authorize?client_id={KAKAO_CLIENT_ID}&response_type=code&redirect_uri={redirect_uri}"
    return RedirectResponse(url)


@router.get("/kakao/callback")
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Kakao OAuth가 설정되지 않았습니다.")
    redirect_uri = f"{BASE_URL}/api/auth/kakao/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post("https://kauth.kakao.com/oauth/token", data={
            "grant_type": "authorization_code", "client_id": KAKAO_CLIENT_ID, "client_secret": KAKAO_CLIENT_SECRET,
            "redirect_uri": redirect_uri, "code": code,
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        access_token = token_resp.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="카카오 인증 실패")
        user_resp = await client.get("https://kapi.kakao.com/v2/user/me", headers={"Authorization": f"Bearer {access_token}"})
        u = user_resp.json()
    account = u.get("kakao_account", {})
    profile = account.get("profile", {})
    user = get_or_create_user(db, "kakao", str(u["id"]), account.get("email"), profile.get("nickname", "카카오 사용자"), profile.get("profile_image_url"))
    response = RedirectResponse(url="/")
    set_auth_cookie(response, create_access_token(user.id))
    return response


# ── Naver ───────────────────────────────────────────────────────────────────

@router.get("/naver")
def naver_login():
    if not NAVER_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Naver OAuth가 설정되지 않았습니다. 관리자에게 문의하세요.")
    redirect_uri = f"{BASE_URL}/api/auth/naver/callback"
    url = (
        "https://nid.naver.com/oauth2.0/authorize"
        f"?client_id={NAVER_CLIENT_ID}"
        "&response_type=code"
        f"&redirect_uri={redirect_uri}"
        "&state=dreammotors"
    )
    return RedirectResponse(url)


@router.get("/naver/callback")
async def naver_callback(code: str, state: str, db: Session = Depends(get_db)):
    if not NAVER_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Naver OAuth가 설정되지 않았습니다.")
    redirect_uri = f"{BASE_URL}/api/auth/naver/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post("https://nid.naver.com/oauth2.0/token", params={
            "grant_type": "authorization_code", "client_id": NAVER_CLIENT_ID,
            "client_secret": NAVER_CLIENT_SECRET, "redirect_uri": redirect_uri,
            "code": code, "state": state,
        })
        access_token = token_resp.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="네이버 인증 실패")
        user_resp = await client.get("https://openapi.naver.com/v1/nid/me", headers={"Authorization": f"Bearer {access_token}"})
        u = user_resp.json().get("response", {})
    user = get_or_create_user(db, "naver", str(u["id"]), u.get("email"), u.get("name", "네이버 사용자"), u.get("profile_image"))
    response = RedirectResponse(url="/")
    set_auth_cookie(response, create_access_token(user.id))
    return response


# ── Admin local login ────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    username: str
    password: str


@router.post("/admin/login")
def admin_login(body: AdminLoginRequest, response: Response, db: Session = Depends(get_db)):
    if body.username != ADMIN_USERNAME or body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다.")
    user = get_or_create_user(db, "local", "admin", "admin@dreammotors.kr", "관리자", is_admin=True)
    set_auth_cookie(response, create_access_token(user.id))
    return {"ok": True}


# ── Me / Logout ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "로그아웃 되었습니다."}
