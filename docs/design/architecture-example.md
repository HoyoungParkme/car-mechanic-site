# 도메인 아키텍처 예시 (FastAPI)

이 문서는 Sprint 1 설계 결정을 돕기 위한 **예시**다. 실제 마이그레이션 시에는 유저 결정에 따라 적용 깊이를 조정한다.

## 핵심 원칙

1. **도메인 단위로 응집한다**: 한 도메인의 router/service/repository/models/schemas는 같은 폴더에 둔다. 도메인끼리는 폴더 경계로 분리.
2. **의존성 방향은 단방향**: `router → service → repository → ORM`. 위에서 아래로만 흐른다. service가 router를 모르고, repository가 service를 모른다.
3. **HTTP는 router 안에만**: `HTTPException`, `Depends`, `status_code` 같은 FastAPI 개념은 router에만 등장한다. service/repository는 순수 Python.
4. **DTO와 도메인 모델 분리**: Pydantic 스키마는 입출력 계약, SQLAlchemy 모델은 DB 표현. service는 도메인 모델을 다루고 router에서 변환.
5. **공통 코드는 core/**: DB 세션, 설정, 보안, 의존성 주입 헬퍼는 도메인 밖에 둔다.

## 제안 폴더 구조

```
artifacts/api-server/python/
├── main.py                       # FastAPI 앱 진입점, 라우터 조립
├── core/
│   ├── __init__.py
│   ├── config.py                 # Settings (Pydantic Settings)
│   ├── database.py               # Engine, SessionLocal, Base
│   ├── security.py               # JWT, 비밀번호 해시
│   └── deps.py                   # get_db, get_current_user, get_admin_user
├── domains/
│   ├── __init__.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── router.py             # /api/auth/*
│   │   ├── service.py            # 로그인/회원가입/OTP/OAuth 로직
│   │   ├── repository.py         # User, PhoneOTP 조회/저장
│   │   ├── models.py             # User, PhoneOTP (SQLAlchemy)
│   │   └── schemas.py            # LoginRequest, RegisterRequest, UserOut ...
│   ├── reservations/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── models.py             # Reservation
│   │   └── schemas.py
│   ├── photos/
│   ├── expertise/
│   ├── shop_info/
│   └── storage/
├── migrations/                   # Alembic
│   ├── env.py
│   └── versions/
└── tests/
    └── domains/
        └── reservations/
            ├── test_service.py
            └── test_repository.py
```

## 두꺼운 3레이어 — `router → service → repository`

### router.py — HTTP 입출력만

```python
"""예약 도메인 HTTP 라우터.

- 경로: /api/reservations
- 책임: 요청 검증, 인증 의존성 주입, 응답 직렬화
- 비즈니스 로직 없음 — 서비스에 위임
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user
from domains.auth.models import User
from .schemas import ReservationCreate, ReservationOut, ReservationUpdate
from .service import ReservationService

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


def get_service(db: Session = Depends(get_db)) -> ReservationService:
    return ReservationService(db)


@router.get("", response_model=list[ReservationOut])
def list_my_reservations(
    user: User = Depends(get_current_user),
    service: ReservationService = Depends(get_service),
):
    """현재 사용자의 예약 목록을 조회한다 (관리자는 전체)."""
    return service.list_for_user(user)


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(
    payload: ReservationCreate,
    user: User = Depends(get_current_user),
    service: ReservationService = Depends(get_service),
):
    """새 예약을 등록한다."""
    return service.create(user=user, payload=payload)


@router.put("/{reservation_id}", response_model=ReservationOut)
def update_reservation(
    reservation_id: int,
    payload: ReservationUpdate,
    user: User = Depends(get_current_user),
    service: ReservationService = Depends(get_service),
):
    """예약 상태/메모를 수정한다 (본인 또는 관리자)."""
    return service.update(reservation_id, user=user, payload=payload)
```

### service.py — 비즈니스 규칙 + 트랜잭션 경계

```python
"""예약 도메인 비즈니스 로직.

- 책임: 권한 검사, 도메인 규칙(시간대 중복 거부 등), 트랜잭션 경계
- 의존: repository에만 의존. ORM 세션을 직접 조작하지 않는다.
"""
from fastapi import HTTPException, status

from domains.auth.models import User
from .models import Reservation
from .repository import ReservationRepository
from .schemas import ReservationCreate, ReservationUpdate


class ReservationService:
    def __init__(self, db):
        self.repo = ReservationRepository(db)

    def list_for_user(self, user: User) -> list[Reservation]:
        if user.is_admin:
            return self.repo.find_all()
        return self.repo.find_by_user(user.id)

    def create(self, user: User, payload: ReservationCreate) -> Reservation:
        if self.repo.exists_in_slot(payload.date, payload.time_slot):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="해당 시간대는 이미 예약되어 있습니다.",
            )
        reservation = Reservation(
            user_id=user.id,
            date=payload.date,
            time_slot=payload.time_slot,
            service_type=payload.service_type,
            vehicle_model=payload.vehicle_model,
            vehicle_number=payload.vehicle_number,
            notes=payload.notes,
            status="pending",
        )
        return self.repo.save(reservation)

    def update(self, reservation_id: int, user: User, payload: ReservationUpdate) -> Reservation:
        reservation = self.repo.find_by_id(reservation_id)
        if reservation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="예약을 찾을 수 없습니다.")
        if not user.is_admin and reservation.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="권한이 없습니다.")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(reservation, key, value)
        return self.repo.save(reservation)
```

### repository.py — ORM 캡슐화

```python
"""예약 영속성 계층.

- 책임: SQLAlchemy 세션을 통한 CRUD
- 비즈니스 규칙 없음 — 단순 조회/저장만
"""
from datetime import date as date_t

from sqlalchemy.orm import Session

from .models import Reservation


class ReservationRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_all(self) -> list[Reservation]:
        return self.db.query(Reservation).order_by(Reservation.date.desc()).all()

    def find_by_user(self, user_id: int) -> list[Reservation]:
        return (
            self.db.query(Reservation)
            .filter(Reservation.user_id == user_id)
            .order_by(Reservation.date.desc())
            .all()
        )

    def find_by_id(self, reservation_id: int) -> Reservation | None:
        return self.db.query(Reservation).filter(Reservation.id == reservation_id).first()

    def exists_in_slot(self, d: date_t, time_slot: str) -> bool:
        return (
            self.db.query(Reservation)
            .filter(Reservation.date == d, Reservation.time_slot == time_slot)
            .first()
            is not None
        )

    def save(self, reservation: Reservation) -> Reservation:
        self.db.add(reservation)
        self.db.commit()
        self.db.refresh(reservation)
        return reservation
```

### models.py / schemas.py — 도메인 폴더 안에 위치

```python
# models.py — SQLAlchemy ORM (현재 python/models.py에서 분리해 가져옴)
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, Date, DateTime, ForeignKey

from core.database import Base


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
```

```python
# schemas.py — Pydantic DTO
from datetime import date, datetime
from pydantic import BaseModel, Field


class ReservationCreate(BaseModel):
    date: date
    time_slot: str = Field(min_length=1, max_length=10)
    service_type: str = Field(min_length=1, max_length=100)
    vehicle_model: str | None = None
    vehicle_number: str | None = None
    notes: str | None = None


class ReservationUpdate(BaseModel):
    status: str | None = None
    rejection_reason: str | None = None
    is_completed: bool | None = None
    is_paid: bool | None = None
    notes: str | None = None


class ReservationOut(BaseModel):
    id: int
    user_id: int
    date: date
    time_slot: str
    service_type: str
    vehicle_model: str | None
    vehicle_number: str | None
    notes: str | None
    status: str
    rejection_reason: str | None
    is_completed: bool
    is_paid: bool
    kakao_notified: bool
    created_at: datetime

    class Config:
        from_attributes = True
```

### main.py — 라우터 조립만

```python
"""FastAPI 앱 진입점."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import Base, engine
from domains.auth.router import router as auth_router
from domains.reservations.router import router as reservations_router
from domains.photos.router import router as photos_router
from domains.expertise.router import router as expertise_router
from domains.shop_info.router import router as shop_info_router
from domains.storage.router import router as storage_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 프로덕션은 Alembic에 위임. 개발 편의용으로 create_all만 유지.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="드림모터스 API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth_router, reservations_router, photos_router, expertise_router, shop_info_router, storage_router):
    app.include_router(r)


@app.get("/api/healthz")
def healthz():
    return {"status": "ok"}
```

---

## 얇은 2레이어 — `router → service` (repository 없음)

비즈니스 로직이 단순하고 단순 CRUD만 있는 도메인(예: `shop_info`, `expertise`)에 적합. service가 ORM을 직접 사용한다.

```python
# domains/shop_info/service.py
from sqlalchemy.orm import Session

from .models import ShopInfo
from .schemas import ShopInfoBulkUpdate


class ShopInfoService:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[ShopInfo]:
        return self.db.query(ShopInfo).all()

    def bulk_update(self, payload: ShopInfoBulkUpdate) -> list[ShopInfo]:
        for item in payload.items:
            existing = self.db.query(ShopInfo).filter(ShopInfo.key == item.key).first()
            if existing:
                existing.value = item.value
            else:
                self.db.add(ShopInfo(key=item.key, value=item.value))
        self.db.commit()
        return self.list_all()
```

- 장점: 적은 코드, 빠른 작성
- 단점: ORM과 비즈니스 로직이 섞임 → 유닛 테스트 시 DB 모킹/픽스처 필요. 도메인 규칙이 추가되면 service가 비대해짐

---

## 두 방식 비교

| 항목 | 두꺼운 3레이어 (router+service+repo) | 얇은 2레이어 (router+service) |
|:--|:--|:--|
| 코드 양 | 도메인당 파일 5개 (router/service/repo/models/schemas) | 도메인당 파일 4개 (router/service/models/schemas) |
| 유닛 테스트 | service를 repo mock으로 격리 가능 → 깔끔 | service 테스트가 DB 의존 → 통합 테스트 위주 |
| 도메인 규칙 추가 시 | service만 변경, 영속성은 그대로 | service에 ORM 호출 + 규칙이 함께 자라 비대해짐 |
| 학습 곡선 | 레이어 역할 분리 학습 필요 | 직관적 |
| 적합한 도메인 | reservations(예약 충돌·권한·상태머신), auth(가입·OTP·OAuth) | shop_info, expertise (단순 CRUD) |

## PM 추천

**도메인별로 깊이를 다르게** 적용한다 (혼합 방식):

| 도메인 | 깊이 | 사유 |
|:--|:--|:--|
| `auth` | 3레이어 | OTP·OAuth·JWT·세션 로직이 많고 테스트 격리 필요 |
| `reservations` | 3레이어 | 예약 충돌 규칙, 권한, 상태 전이가 있어 service가 핵심 |
| `storage` | 3레이어 | GCS 어댑터를 repo로 격리 → 추후 다른 스토리지 교체 용이 |
| `photos` | 2레이어 | 단순 CRUD |
| `expertise` | 2레이어 | 단순 CRUD |
| `shop_info` | 2레이어 | key-value 형태, 단순 |

전체를 두껍게 적용하지 않는 이유: 단순 도메인에까지 repo 레이어를 강제하면 보일러플레이트만 늘고 가치가 없다. CLAUDE.md의 "과한 추상화 금지" 원칙과도 부합.

전체를 얇게 적용하지 않는 이유: 핵심 도메인(reservations, auth)의 비즈니스 규칙이 자라면 결국 repo가 필요해지는데, 그때 가서 리팩토링하면 비용이 크다.

## 의존성 방향 (요약 다이어그램)

```
HTTP Request
    │
    ▼
┌───────────────────┐
│  domains/X/router │ ← FastAPI 의존성, HTTPException 여기서만
└────────┬──────────┘
         │  Pydantic 스키마 (입력)
         ▼
┌───────────────────┐
│  domains/X/service│ ← 비즈니스 규칙, 트랜잭션 경계
└────────┬──────────┘
         │  도메인 모델 (Reservation 등)
         ▼
┌───────────────────┐
│ domains/X/repo    │ ← SQLAlchemy 세션 캡슐화 (3레이어일 때만)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ domains/X/models  │ ← SQLAlchemy ORM
└───────────────────┘

공통: core/{config, database, security, deps}
```
