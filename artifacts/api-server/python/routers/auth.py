import os
import random
import string
from datetime import datetime, timedelta
import httpx
from fastapi import APIRouter, Depends, Response, HTTPException
from fastapi.responses import RedirectResponse
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
from models import User, PhoneOTP
from auth import create_access_token, get_current_user
from schemas import (
    UserOut, LocalLoginRequest, RegisterRequest,
    PhoneSendRequest, PhoneVerifyRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
IS_DEV = BASE_DOMAIN.startswith("localhost")

RESERVED_USERNAMES = {"admin", "관리자", "administrator", "root", "system"}


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token,
        httponly=True, secure=COOKIE_SECURE, samesite="lax",
        max_age=30 * 24 * 3600, path="/",
    )


def get_or_create_oauth_user(db: Session, provider: str, oauth_id: str,
                              email: str | None, name: str,
                              profile_image: str | None = None,
                              is_admin: bool = False) -> User:
    user = db.query(User).filter(User.oauth_provider == provider, User.oauth_id == oauth_id).first()
    if not user:
        user = User(oauth_provider=provider, oauth_id=oauth_id,
                    email=email, name=name, profile_image=profile_image, is_admin=is_admin)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif is_admin and not user.is_admin:
        user.is_admin = True
        db.commit()
    return user


def seed_demo_reservations(db: Session, admin_id: int):
    from models import Reservation
    from datetime import date as date_type
    if db.query(Reservation).count() > 0:
        return
    demos = [
        Reservation(user_id=admin_id, date=date_type(2026, 5, 19), time_slot="10:00", service_type="엔진오일 교환", vehicle_model="쏘나타 DN8", vehicle_number="12가 3456", notes="주행 거리 15만km, 합성유 요청", status="pending"),
        Reservation(user_id=admin_id, date=date_type(2026, 5, 19), time_slot="10:00", service_type="브레이크 점검", vehicle_model="아반떼 CN7", vehicle_number="78나 9012", notes="제동 시 소음 발생", status="pending"),
        Reservation(user_id=admin_id, date=date_type(2026, 5, 20), time_slot="14:00", service_type="타이어 교환", vehicle_model="그랜저 IG", vehicle_number="34다 5678", notes="4본 교환 희망", status="confirmed"),
        Reservation(user_id=admin_id, date=date_type(2026, 5, 21), time_slot="11:00", service_type="배터리 교체", vehicle_model="K5 3세대", vehicle_number="56라 7890", notes=None, status="confirmed", is_completed=True, is_paid=True, kakao_notified=True),
        Reservation(user_id=admin_id, date=date_type(2026, 5, 22), time_slot="09:00", service_type="종합 정밀진단", vehicle_model="팰리세이드", vehicle_number="90마 1234", notes="구매 전 점검", status="rejected", rejection_reason="해당 일정 이미 만차"),
        Reservation(user_id=admin_id, date=date_type(2026, 5, 23), time_slot="15:00", service_type="에어컨 점검", vehicle_model="카니발 KA4", vehicle_number="11바 2233", notes=None, status="confirmed", is_completed=True, is_paid=False, kakao_notified=True),
    ]
    for d in demos:
        db.add(d)
    db.commit()


# ── Local ID/PW login ────────────────────────────────────────────────────────

@router.post("/login")
def local_login(body: LocalLoginRequest, response: Response, db: Session = Depends(get_db)):
    # Admin shortcut
    if body.username == ADMIN_USERNAME and body.password == ADMIN_PASSWORD:
        user = db.query(User).filter(User.oauth_provider == "local", User.oauth_id == "admin").first()
        if not user:
            user = User(oauth_provider="local", oauth_id="admin", username=ADMIN_USERNAME,
                        email="admin@dreammotors.kr", name="관리자", is_admin=True)
            db.add(user)
            db.commit()
            db.refresh(user)
            seed_demo_reservations(db, user.id)
        elif not user.is_admin:
            user.is_admin = True
            db.commit()
        if user.username != ADMIN_USERNAME:
            user.username = ADMIN_USERNAME
            db.commit()
        set_auth_cookie(response, create_access_token(user.id))
        return {"ok": True, "is_admin": True}

    # Regular user
    user = db.query(User).filter(User.username == body.username, User.oauth_provider == "local").first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다.")
    if not pwd_ctx.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다.")

    set_auth_cookie(response, create_access_token(user.id))
    return {"ok": True, "is_admin": user.is_admin}


# ── Phone OTP ────────────────────────────────────────────────────────────────

@router.post("/phone/send")
def phone_send(body: PhoneSendRequest, db: Session = Depends(get_db)):
    phone = body.phone.strip().replace("-", "").replace(" ", "")
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="올바른 전화번호를 입력해주세요.")

    otp_code = "".join(random.choices(string.digits, k=6))
    expires = datetime.utcnow() + timedelta(minutes=5)

    otp = PhoneOTP(phone=phone, otp_code=otp_code, expires_at=expires)
    db.add(otp)
    db.commit()

    # In production: send via SMS API (NCP, Aligo, Twilio, etc.)
    # For now, return the code so it can be tested
    print(f"[OTP] {phone} → {otp_code}")
    return {"sent": True, "dev_otp": otp_code}  # dev_otp removed in production


@router.post("/phone/verify")
def phone_verify(body: PhoneVerifyRequest, db: Session = Depends(get_db)):
    phone = body.phone.strip().replace("-", "").replace(" ", "")
    now = datetime.utcnow()

    otp = (db.query(PhoneOTP)
           .filter(PhoneOTP.phone == phone, PhoneOTP.is_used == False)
           .order_by(PhoneOTP.created_at.desc())
           .first())

    if not otp or otp.expires_at < now:
        raise HTTPException(status_code=400, detail="인증번호가 만료되었습니다. 다시 발송해주세요.")
    if otp.otp_code != body.otp_code:
        raise HTTPException(status_code=400, detail="인증번호가 올바르지 않습니다.")

    otp.is_verified = True
    db.commit()
    return {"verified": True}


# ── Register ─────────────────────────────────────────────────────────────────

@router.post("/register")
def register(body: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    username = body.username.strip()
    phone = body.phone.strip().replace("-", "").replace(" ", "")

    if username.lower() in RESERVED_USERNAMES:
        raise HTTPException(status_code=400, detail="사용할 수 없는 아이디입니다.")
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="아이디는 3자 이상이어야 합니다.")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="비밀번호는 6자 이상이어야 합니다.")

    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=409, detail="이미 사용 중인 아이디입니다.")

    # Check phone was verified
    now = datetime.utcnow()
    otp = (db.query(PhoneOTP)
           .filter(PhoneOTP.phone == phone, PhoneOTP.is_verified == True, PhoneOTP.is_used == False)
           .order_by(PhoneOTP.created_at.desc())
           .first())
    if not otp or otp.expires_at < now:
        raise HTTPException(status_code=400, detail="전화번호 인증을 완료해주세요.")

    # Create user
    hashed = pwd_ctx.hash(body.password)
    user = User(
        oauth_provider="local",
        oauth_id=f"local:{username}",
        name=body.name.strip(),
        username=username,
        password_hash=hashed,
        phone=phone,
    )
    db.add(user)
    otp.is_used = True
    db.commit()
    db.refresh(user)

    set_auth_cookie(response, create_access_token(user.id))
    return {"ok": True}


# ── Google ───────────────────────────────────────────────────────────────────

@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth가 설정되지 않았습니다.")
    redirect_uri = f"{BASE_URL}/api/auth/google/callback"
    url = (f"https://accounts.google.com/o/oauth2/v2/auth?client_id={GOOGLE_CLIENT_ID}"
           "&response_type=code"
           f"&redirect_uri={redirect_uri}&scope=openid%20email%20profile&access_type=offline")
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
        access_token = token_resp.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Google 인증 실패")
        user_resp = await client.get("https://www.googleapis.com/oauth2/v2/userinfo",
                                     headers={"Authorization": f"Bearer {access_token}"})
        u = user_resp.json()
    user = get_or_create_oauth_user(db, "google", str(u["id"]), u.get("email"), u.get("name", "사용자"), u.get("picture"))
    response = RedirectResponse(url="/")
    set_auth_cookie(response, create_access_token(user.id))
    return response


# ── Kakao ─────────────────────────────────────────────────────────────────────

@router.get("/kakao")
def kakao_login():
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Kakao OAuth가 설정되지 않았습니다.")
    redirect_uri = f"{BASE_URL}/api/auth/kakao/callback"
    return RedirectResponse(f"https://kauth.kakao.com/oauth/authorize?client_id={KAKAO_CLIENT_ID}&response_type=code&redirect_uri={redirect_uri}")


@router.get("/kakao/callback")
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    if not KAKAO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Kakao OAuth가 설정되지 않았습니다.")
    redirect_uri = f"{BASE_URL}/api/auth/kakao/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post("https://kauth.kakao.com/oauth/token", data={
            "grant_type": "authorization_code", "client_id": KAKAO_CLIENT_ID,
            "client_secret": KAKAO_CLIENT_SECRET, "redirect_uri": redirect_uri, "code": code,
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        access_token = token_resp.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="카카오 인증 실패")
        user_resp = await client.get("https://kapi.kakao.com/v2/user/me",
                                     headers={"Authorization": f"Bearer {access_token}"})
        u = user_resp.json()
    account = u.get("kakao_account", {})
    profile = account.get("profile", {})
    user = get_or_create_oauth_user(db, "kakao", str(u["id"]), account.get("email"),
                                    profile.get("nickname", "카카오 사용자"), profile.get("profile_image_url"))
    response = RedirectResponse(url="/")
    set_auth_cookie(response, create_access_token(user.id))
    return response


# ── Naver ─────────────────────────────────────────────────────────────────────

@router.get("/naver")
def naver_login():
    if not NAVER_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Naver OAuth가 설정되지 않았습니다.")
    redirect_uri = f"{BASE_URL}/api/auth/naver/callback"
    return RedirectResponse(f"https://nid.naver.com/oauth2.0/authorize?client_id={NAVER_CLIENT_ID}&response_type=code&redirect_uri={redirect_uri}&state=dreammotors")


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
        user_resp = await client.get("https://openapi.naver.com/v1/nid/me",
                                     headers={"Authorization": f"Bearer {access_token}"})
        u = user_resp.json().get("response", {})
    user = get_or_create_oauth_user(db, "naver", str(u["id"]), u.get("email"),
                                    u.get("name", "네이버 사용자"), u.get("profile_image"))
    response = RedirectResponse(url="/")
    set_auth_cookie(response, create_access_token(user.id))
    return response


# ── Me / Logout ───────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "로그아웃 되었습니다."}
