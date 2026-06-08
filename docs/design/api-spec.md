# API 스펙 (Sprint 1)

## 전략

- 변경점:
  1. 스토리지: GCS Signed URL → **로컬 multipart 업로드**로 흐름 변경
  2. **인증 정책 전면 개편 (PM-06)**: 로컬 ID/PW·phone OTP·회원가입 엔드포인트 4개 폐기. OAuth만 유지
- 응답 포맷·인증 방식(JWT HTTP-Only 쿠키)·에러 응답 구조는 그대로.

## 공통 사항

### 인증
- `Authorization`은 사용하지 않는다. JWT는 HTTP-Only 쿠키 `access_token`(30일)에 저장.
- 보호 엔드포인트는 라우터에서 `Depends(get_current_user)` 또는 `Depends(get_admin_user)`.

### 응답 포맷
- 성공: Pydantic 모델 직렬화 (JSON)
- 에러: FastAPI 기본 `{"detail": "<message>"}`
- 페이지네이션: 이번 스프린트에서는 도입하지 않는다 (현재 데이터량 적음)

### 에러 코드

| 상태 | 의미 | 예시 |
|:--|:--|:--|
| 400 | 입력 검증 실패 | 필수 필드 누락, 형식 오류 |
| 401 | 인증 없음 / 만료 | 쿠키 없음·만료 |
| 403 | 권한 없음 | 비관리자가 관리자 API 호출 |
| 404 | 리소스 없음 | 존재하지 않는 reservation_id |
| 409 | 충돌 | 시간대 중복 예약, username 중복 |
| 422 | Pydantic 검증 실패 | FastAPI 기본 |
| 503 | 외부 서비스 미설정 | OAuth env 미설정 |

## 엔드포인트 (도메인별)

### auth (`domains/auth/router.py`) — **PM-06 개편**

| Method | Path | 인증 | Body / Query | 응답 | 비고 |
|:--|:--|:--|:--|:--|:--|
| GET | /api/auth/google | 없음 | - | 302 redirect to Google | env 미설정 시 503 |
| GET | /api/auth/google/callback | 없음 | code (query) | 302 redirect to `/` + 쿠키 | 콜백에서 화이트리스트 매칭 시 `is_admin` 자동 set |
| GET | /api/auth/kakao | 없음 | - | 302 redirect | env 미설정 시 503 |
| GET | /api/auth/kakao/callback | 없음 | code (query) | 302 redirect + 쿠키 | 위와 동일 |
| GET | /api/auth/naver | 없음 | - | 302 redirect | env 미설정 시 503 |
| GET | /api/auth/naver/callback | 없음 | code, state (query) | 302 redirect + 쿠키 | 위와 동일 |
| GET | /api/auth/me | 필수 | - | `UserOut` | 현재 사용자. frontend가 콜백 후 호출해 `is_admin` 분기 |
| POST | /api/auth/logout | 없음 | - | `{ok: true}` + 쿠키 삭제 | |

#### 폐기된 엔드포인트 (PM-06)

- ~~`POST /api/auth/login`~~ — 로컬 ID/PW 로그인 폐기
- ~~`POST /api/auth/register`~~ — 로컬 가입 폐기
- ~~`POST /api/auth/phone/send`~~ — phone OTP 폐기
- ~~`POST /api/auth/phone/verify`~~ — phone OTP 폐기

### reservations (`domains/reservations/router.py`) — Sprint 2 확장

| Method | Path | 인증 | Body / Query | 응답 | 비고 |
|:--|:--|:--|:--|:--|:--|
| GET | /api/reservations | 사용자 | - | `list[ReservationOut]` | 관리자는 전체, 일반은 본인 것만 |
| POST | /api/reservations | **Optional** | `ReservationCreate`{customer_name, customer_phone, ...} | `ReservationCreatedOut`(id, lookup_code, ...) (201) | 비로그인도 허용. 시간대 충돌 409 |
| GET | /api/reservations/lookup | 없음 | `phone`, `code` (query) | `ReservationOut` | **신규** 비회원 조회. 매칭 실패 404. rate limit (5분 10회 실패 시 429) |
| DELETE | /api/reservations/lookup | 없음 | `phone`, `code` (query) | `{cancelled: true}` | **신규** 비회원 취소 (status='rejected'). rate limit 동일 |
| PUT | /api/reservations/{id} | 사용자 | `ReservationUpdate` | `ReservationOut` | 본인 또는 관리자만. **B-4: status는 Literal 제약** |
| DELETE | /api/reservations/{id} | 사용자 | - | 204 | 본인 또는 관리자만 |

#### Pydantic 스키마 (Sprint 2)

```python
class ReservationCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=100)
    customer_phone: str = Field(min_length=10, max_length=20)
    date: dt.date
    time_slot: str = Field(min_length=1, max_length=10)
    service_type: str = Field(min_length=1, max_length=100)
    vehicle_model: str | None = None
    vehicle_number: str | None = None
    notes: str | None = None

class ReservationCreatedOut(ReservationOut):
    """예약 생성 응답 — lookup_code 포함."""
    lookup_code: str

class ReservationUpdate(BaseModel):
    status: Literal["pending", "confirmed", "rejected", "completed"] | None = None  # B-4
    # ... (기타 필드 동일)
```

#### Rate limit 동작

- 키: `client_ip` (`X-Forwarded-For` 첫 번째 또는 `request.client.host`)
- 윈도우: 5분 슬라이딩
- 실패 임계치: 10회 → 429 응답 `{"detail": "잠시 후 다시 시도해주세요."}`
- 성공 응답 시 카운터 리셋

### photos (`domains/photos/router.py`)

| Method | Path | 인증 | Body | 응답 | 비고 |
|:--|:--|:--|:--|:--|:--|
| GET | /api/photos | 없음 | - | `list[PhotoOut]` | sort_order 정렬 |
| POST | /api/photos | 관리자 | `PhotoCreate`{url, caption?, sort_order?} | `PhotoOut` (201) | url은 storage 업로드 응답에서 |
| DELETE | /api/photos/{id} | 관리자 | - | 204 | |

### expertise (`domains/expertise/router.py`)

| Method | Path | 인증 | Body | 응답 | 비고 |
|:--|:--|:--|:--|:--|:--|
| GET | /api/expertise | 없음 | - | `list[ExpertiseOut]` | |
| POST | /api/expertise | 관리자 | `ExpertiseCreate` | `ExpertiseOut` (201) | |
| PUT | /api/expertise/{id} | 관리자 | `ExpertiseUpdate` | `ExpertiseOut` | |
| DELETE | /api/expertise/{id} | 관리자 | - | 204 | |

### shop_info (`domains/shop_info/router.py`)

| Method | Path | 인증 | Body | 응답 | 비고 |
|:--|:--|:--|:--|:--|:--|
| GET | /api/shop-info | 없음 | - | `list[ShopInfoItem]` | key-value 전체 |
| PUT | /api/shop-info | 관리자 | `ShopInfoBulkUpdate`{items: [{key, value}]} | `list[ShopInfoItem]` | upsert |

### storage (`domains/storage/router.py`) — **변경됨**

| Method | Path | 인증 | Body / Query | 응답 | 비고 |
|:--|:--|:--|:--|:--|:--|
| ~~POST~~ ~~/api/storage/upload-url~~ | — | — | — | — | **폐기** (GCS Signed URL) |
| POST | /api/storage/upload | 관리자 | `multipart/form-data` file | `{url: "/uploads/<uuid>.<ext>"}` | **신규** — 직접 multipart 업로드 |
| GET | /uploads/{filename} | 없음 | - | 파일 바이트 | StaticFiles 마운트 (정적 서빙) |

#### 업로드 제약
- 파일 크기: 최대 5MB (router에서 검증)
- 확장자 화이트리스트: `.jpg`, `.jpeg`, `.png`, `.webp`
- 저장 경로: `{settings.uploads_dir}/{uuid4()}.{ext}`
- public URL: `/uploads/{filename}`

#### 어댑터 인터페이스 (추후 GCS/S3 교체용)
```python
# domains/storage/repository.py
from typing import Protocol

class StorageRepository(Protocol):
    async def save(self, file: UploadFile) -> str:
        """파일 저장 후 public URL 반환."""
    async def delete(self, url: str) -> None:
        """URL이 가리키는 파일 삭제."""
```

### health

| Method | Path | 인증 | 응답 |
|:--|:--|:--|:--|
| GET | /api/healthz | 없음 | `{status: "ok"}` |

## Pydantic 스키마 (도메인별 핵심만)

### auth (PM-06 슬림화)

```python
class UserOut(BaseModel):
    """현재 로그인 사용자 응답."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str | None
    is_admin: bool
    profile_image: str | None
    created_at: datetime
```

> PM-06 삭제 스키마: `LocalLoginRequest`, `PhoneSendRequest`, `PhoneVerifyRequest`, `RegisterRequest`.
> `UserOut`에서 `username`, `phone`, `oauth_provider` 제거 (provider는 클라이언트에 노출 불필요).

### reservations

```python
class ReservationCreate(BaseModel):
    date: date
    time_slot: str = Field(min_length=1, max_length=10)
    service_type: str = Field(min_length=1, max_length=100)
    vehicle_model: str | None = None
    vehicle_number: str | None = None
    notes: str | None = None

class ReservationUpdate(BaseModel):
    status: Literal["pending", "confirmed", "rejected", "completed"] | None = None
    rejection_reason: str | None = None
    is_completed: bool | None = None
    is_paid: bool | None = None
    notes: str | None = None
    kakao_notified: bool | None = None

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

### storage (변경)

```python
class UploadResponse(BaseModel):
    url: str  # 예: "/uploads/abc-123.jpg"
```

## 프론트엔드 통합 영향

### Sprint 1 (PM-06) 영향

| 프론트 컴포넌트 | 변경 사항 |
|:--|:--|
| `pages/Login.tsx` | 로컬 가입/로그인 폼 전부 삭제. Google/Kakao/Naver 버튼 3개만. OAuth 콜백 후 `/me` 호출해 `is_admin`이면 `/admin`으로 라우팅 |

### Sprint 2 이후

| 프론트 컴포넌트 | 변경 사항 |
|:--|:--|
| `pages/Admin.tsx` PhotosTab | API 연결 + 신규 `/api/storage/upload` multipart 업로드 form |
| `pages/Admin.tsx` ExpertiseTab | API 연결 (`/api/expertise` GET/POST/PUT/DELETE) |
| `pages/Admin.tsx` ShopInfoTab | API 연결 (`/api/shop-info` GET/PUT) |
| `pages/Reservation.tsx` | 비회원 예약 + 회원/비회원 통합 폼 (REQ-03) |

## 비고

- API 문서(`/docs`, `/redoc`)는 FastAPI 자동 생성으로 충분. `lib/api-spec/openapi.yaml`은 폐기.
- 코드젠(`lib/api-zod`, `lib/api-client-react`)도 폐기. 프론트는 기존대로 fetch 직접 호출. (필요 시 추후 `openapi-typescript`로 타입만 생성 가능)
