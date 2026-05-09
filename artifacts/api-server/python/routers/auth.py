import os
import httpx
from fastapi import APIRouter, Depends, Response, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import create_access_token, get_current_user, get_current_user_optional
from schemas import UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID", "")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET", "")

REPLIT_DOMAINS = os.getenv("REPLIT_DOMAINS", "localhost")
BASE_DOMAIN = REPLIT_DOMAINS.split(",")[0].strip()
BASE_URL = f"https://{BASE_DOMAIN}" if not BASE_DOMAIN.startswith("localhost") else f"http://localhost:80"

COOKIE_SECURE = not BASE_DOMAIN.startswith("localhost")
COOKIE_DOMAIN = None


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


@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth가 설정되지 않았습니다.")
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
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Google 인증 실패")

        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_data = user_resp.json()

    user = db.query(User).filter(
        User.oauth_provider == "google",
        User.oauth_id == str(user_data["id"]),
    ).first()

    if not user:
        user = User(
            oauth_provider="google",
            oauth_id=str(user_data["id"]),
            email=user_data.get("email"),
            name=user_data.get("name", "사용자"),
            profile_image=user_data.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token(user.id)
    response = RedirectResponse(url="/")
    set_auth_cookie(response, jwt_token)
    return response


@router.get("/kakao")
def kakao_login():
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Kakao OAuth가 설정되지 않았습니다.")
    redirect_uri = f"{BASE_URL}/api/auth/kakao/callback"
    url = (
        "https://kauth.kakao.com/oauth/authorize"
        f"?client_id={KAKAO_CLIENT_ID}"
        "&response_type=code"
        f"&redirect_uri={redirect_uri}"
    )
    return RedirectResponse(url)


@router.get("/kakao/callback")
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Kakao OAuth가 설정되지 않았습니다.")
    redirect_uri = f"{BASE_URL}/api/auth/kakao/callback"

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": KAKAO_CLIENT_ID,
                "client_secret": KAKAO_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="카카오 인증 실패")

        user_resp = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_data = user_resp.json()

    kakao_id = str(user_data["id"])
    kakao_account = user_data.get("kakao_account", {})
    profile = kakao_account.get("profile", {})

    user = db.query(User).filter(
        User.oauth_provider == "kakao",
        User.oauth_id == kakao_id,
    ).first()

    if not user:
        user = User(
            oauth_provider="kakao",
            oauth_id=kakao_id,
            email=kakao_account.get("email"),
            name=profile.get("nickname", "카카오 사용자"),
            profile_image=profile.get("profile_image_url"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token(user.id)
    response = RedirectResponse(url="/")
    set_auth_cookie(response, jwt_token)
    return response


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "로그아웃 되었습니다."}
