# 기술 결정 (Sprint 1)

작업명: FastAPI 도메인 아키텍처 마이그레이션
제약: **무료로 진행** (유료 외부 서비스 보류)

상세 판단 로그는 `docs/pm/02_sprint1-tech-decisions.md` 참고.

## 한눈 표

| 영역 | 결정 | 비고 |
|:--|:--|:--|
| 언어/런타임 | Python 3.11+ | 기존 |
| 의존성 관리 | requirements.txt | 추후 uv 전환 가능 |
| 가상환경 | 표준 venv | `.venv/` |
| 웹 프레임워크 | FastAPI | 기존 |
| ORM | SQLAlchemy 2.x | 기존 |
| 검증 | Pydantic v2 | 기존 |
| DB | PostgreSQL 15+ | 로컬 Docker, Replit 기존 환경 |
| DB 마이그레이션 | **Alembic 신규 도입** | `create_all + run_migrations` 폐기 |
| 인증 | **OAuth-only** (Google/Kakao/Naver) + JWT HTTP-Only 쿠키 | 로컬 ID/PW·phone OTP 폐기 (PM-06) |
| 관리자 식별 | `.env ADMIN_EMAILS` 화이트리스트, 매 OAuth 로그인 시 자동 승격 | PM-06 결정 |
| 비밀번호 해시 | **제거** (로컬 가입 폐기로 불필요) | `passlib`/`bcrypt` 의존성 제거 |
| 백엔드 구조 | 도메인 단위 응집 | `core/` + `domains/<name>/` |
| 아키텍처 깊이 | 혼합 | 핵심 3레이어, 단순 2레이어 |
| 캐싱 | 없음 | 추후 필요 시 |
| 테스트 | pytest + httpx | 신규 도입 |
| 스토리지 | **로컬 파일 (`./uploads/`)** | GCS 폐기, 어댑터 추후 교체 가능 |
| SMS OTP | **폐기** (PM-06) | 회원가입은 OAuth만 |
| PASS 본인인증 | **도입 안 함** (PM-06) | 가입비/건당비 회피 |
| 카카오 알림톡 | 보류 | UI는 안내문/비활성화 |
| OAuth | env 미설정 시 503 유지 | 사용자 등록 후 활성화 |
| 배포 | Sprint 1 범위 외 | 로컬 동작 보장만 |

## 1. 개발 환경

```bash
# 가상환경
cd artifacts/api-server/python
python -m venv .venv
source .venv/Scripts/activate    # Windows Git Bash
pip install -r requirements.txt

# 로컬 DB (선택)
docker compose up -d postgres
```

`docker-compose.yml`을 `artifacts/api-server/python/` 또는 프로젝트 루트에 신규 작성.

## 2. 데이터 저장소

- PostgreSQL 15+
- 로컬 개발용 Docker Compose 제공
- 운영은 Replit Postgres 그대로 사용

## 3. DB 마이그레이션 — Alembic

기존:
```python
Base.metadata.create_all(bind=engine)
run_migrations()  # ADD COLUMN IF NOT EXISTS, 예외 무시
```

신규:
```bash
alembic init migrations
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

- `migrations/env.py`에서 `core.database.Base.metadata`를 target_metadata로 지정
- 신규 컬럼/제약 변경 시 항상 마이그레이션 생성 → 리뷰 → 커밋
- 앱 시작 시 자동 `upgrade head`는 하지 않는다 (배포 파이프라인에서 명시적으로)

## 4. 인증/인가 (PM-06 개편)

### 정책

- **OAuth-only**. Google/Kakao/Naver만 지원. 로컬 ID/PW 가입·로그인·phone OTP 모두 폐기
- JWT (HS256), HTTP-Only 쿠키 `access_token`, 30일 만료
- `JWT_SECRET_KEY` 미설정 시 앱 시작 거부 (안전한 디폴트)
- OAuth: env 미설정 시 503 유지 (코드는 보존)

### 관리자 식별 — 이메일 화이트리스트

- `.env`의 `ADMIN_EMAILS=owner@example.com,partner@example.com` (콤마 구분)
- `upsert_oauth_user`에서 매 OAuth 로그인 시 이메일을 화이트리스트와 비교
  - 매칭 시 `is_admin=true`로 set (강등은 안 함 — set-only)
  - 비매칭 시 기존 값 유지
- 별도 시드 스크립트 불필요 (`seed_admin.py` 폐기)
- 카카오 OAuth는 이메일 동의 항목을 Kakao Developers 콘솔에서 켜둬야 함

### 폐기되는 엔드포인트

- `POST /api/auth/login` (로컬 로그인)
- `POST /api/auth/register` (로컬 가입)
- `POST /api/auth/phone/send`, `/api/auth/phone/verify` (OTP)

### 폐기되는 모델/컬럼

- `PhoneOTP` 테이블 전체
- `User.username`, `User.password_hash`, `User.phone`

### 콜백 후 관리자 분기

- OAuth 콜백은 무조건 `/`로 redirect
- frontend가 페이지 진입 시 `GET /api/auth/me` 호출 → `is_admin`이면 `/admin`으로 라우팅

## 5. 백엔드 아키텍처

폴더:
```
artifacts/api-server/python/
├── main.py
├── core/
│   ├── config.py        # pydantic-settings
│   ├── database.py      # Engine, SessionLocal, Base
│   ├── security.py      # JWT, bcrypt
│   └── deps.py          # get_db, get_current_user, get_admin_user
├── domains/
│   ├── auth/            # 3레이어 — OTP/OAuth/JWT 로직 많음
│   ├── reservations/    # 3레이어 — 시간 충돌·상태머신
│   ├── storage/         # 3레이어 — 어댑터(로컬→S3 가능)
│   ├── photos/          # 2레이어 — 단순 CRUD
│   ├── expertise/       # 2레이어 — 단순 CRUD
│   └── shop_info/       # 2레이어 — key-value
├── migrations/          # Alembic
├── tests/
└── uploads/             # 로컬 스토리지 (gitignore)
```

레이어 책임 + 의존성 방향은 `docs/design/architecture-example.md` 참고.

## 6. 스토리지 (무료)

### 변경 사항
- 기존: GCS Signed URL (POST `/api/storage/upload-url`로 URL 받아 클라이언트가 PUT)
- 신규: multipart 업로드 (`POST /api/storage/upload` 받아서 서버가 `./uploads/{uuid}.{ext}` 저장)

### 정적 서빙
```python
# main.py
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

### 어댑터 인터페이스 (추후 교체용) — async 통일

```python
# domains/storage/repository.py
from typing import Protocol
from fastapi import UploadFile

class StorageRepository(Protocol):
    async def save(self, file: UploadFile) -> str: ...  # public URL 반환
    async def delete(self, url: str) -> None: ...

class LocalStorageRepository:
    """로컬 파일 시스템 저장 (async 인터페이스, 내부는 anyio.to_thread)."""
    ...

# 추후 GCSStorageRepository, S3StorageRepository로 교체 가능 (대부분 async)
```

`UploadFile.read()`가 async이므로 인터페이스를 async로 통일했다.

`core/deps.py`에서 환경변수로 어댑터 선택:
```python
def get_storage_repo() -> StorageRepository:
    return LocalStorageRepository(settings.uploads_dir)
```

## 7. SMS OTP — **폐기** (PM-06)

회원가입을 OAuth만으로 받기로 결정. SMS OTP / PASS 본인인증 비용 회피.

폐기 대상:
- `POST /api/auth/phone/send`, `/api/auth/phone/verify` 엔드포인트
- `PhoneOTP` SQLAlchemy 모델, `PhoneOTPCRUD`
- `domains/auth/utils.normalize_phone`
- 응답 헤더 `X-Dev-OTP` 노출 로직 (`main.py` CORS expose_headers에서도 제거)

## 8. 카카오 알림톡

- 코드 보존 (`kakao_notified` 컬럼, UI 버튼)
- 버튼은 "준비 중" 상태 또는 비활성화
- 백엔드 API는 컬럼 토글만 하고 실제 발송 안 함 (이미 현재 그대로)

## 9. 환경변수

### `.env.example` (신규 작성)

```dotenv
# 필수
DATABASE_URL=postgresql://user:pass@localhost:5432/carmechanic
JWT_SECRET_KEY=                  # 운영은 32바이트 이상 랜덤

# 환경 분기
ENV=dev                          # dev | prod

# 관리자 화이트리스트 (콤마 구분, OAuth 이메일 기준)
ADMIN_EMAILS=

# OAuth (선택, 미설정 시 503)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# Replit CORS (선택)
REPLIT_DOMAINS=

# 스토리지 (로컬)
UPLOADS_DIR=./uploads

# 포트
PORT=8080
```

### Settings 클래스
```python
# core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    database_url: str
    jwt_secret_key: str = Field(min_length=16)
    env: str = "dev"
    admin_emails: list[str] = []          # 콤마 구분 입력 → list 파싱
    uploads_dir: str = "./uploads"
    port: int = 8080
    # ... OAuth keys (all optional)

settings = Settings()
```

`jwt_secret_key`에 `min_length=16`을 두면 빈 값일 때 앱 시작 거부.

## 10. 로깅 (보완)

- Python 표준 `logging` 모듈 + `core/logging.py`에 단일 설정
- dev: 컬러 텍스트, prod: JSON 한 줄 (선택)
- uvicorn 로거 통합
- 의존성 추가 없음

## 11. 에러 핸들링 (보완)

- `core/errors.py`에 전역 핸들러 등록 (`app.add_exception_handler`)
  - `HTTPException`: 기본 응답 유지, 로그에 경로 기록
  - `RequestValidationError`(422): `{"detail": [{"field", "message"}]}` flat 포맷
  - `Exception`(500): 스택은 로그, 응답은 `{"detail": "internal server error"}` (정보 누출 방지)

## 12. Refresh Token

- **사용하지 않음**. 액세스 토큰 30일 만료 단일 토큰.
- 만료 시 프론트가 401 받으면 로그인 페이지로 리다이렉트
- 트레이드오프: 30일 폭로 윈도. 향후 블랙리스트 도입 검토 (파킹랏)

## 13. 관리자 시드 — **폐기** (PM-06)

- 이메일 화이트리스트(`ADMIN_EMAILS`)로 대체
- `scripts/seed_admin.py` 삭제
- 점주가 OAuth 로그인하면 화이트리스트 매칭으로 자동 승격

## 14. 사용자 입력 검증 — **단순화** (PM-06)

- 로컬 가입 폐기로 `username`/`password` 검증 로직 제거
- OAuth 콜백에서 받는 사용자 정보(name, email)는 provider 응답 신뢰

## 15. 테스트

- `pytest`, `httpx.AsyncClient` (FastAPI TestClient 대신)
- 테스트 DB: SQLite in-memory (속도) 또는 Postgres 컨테이너 (정합)
  - 단위 테스트(service): mock repository
  - 통합 테스트(router): SQLite + dependency override
- 도메인별 `tests/domains/<name>/test_service.py` 구조
- Sprint 1 검증 단계에서 test-writer agent에게 위임

## 15. Sprint 2: 비회원 예약 (REQ-03 / PM-08)

### 예약번호 (lookup_code)
- `String(6) NOT NULL UNIQUE` 컬럼
- 영숫자 6자리, 헷갈리는 0/O/1/I/L 제외한 문자 집합(약 30자) 사용
- `secrets.choice` 사용. 충돌 시 재시도(최대 5회)

### 비회원 조회 보안
- `phone + lookup_code` 둘 다 일치해야 응답
- IP 기준 in-memory rate limit (`core/rate_limit.py`)
  - 윈도우: 5분
  - 실패 임계치: 10회 → 429 응답
  - 프록시 뒤에서는 `X-Forwarded-For` 첫 번째 값
- Sprint 2 단일 워커 가정. 다중 워커 운영 시 Redis 도입 (백로그 B-6)

### 회원 폼 데이터 정합성
- 회원/비회원 모두 폼 입력값을 `Reservation.customer_*`에 저장 (User 정보 무관)
- 대리 예약 케이스 허용

### 비회원 취소
- hard delete 아님 — `status='rejected'` 변경. 이력 보존, 슬롯은 비움

### Reservation 변경 요약
| 컬럼 | 변경 |
|:--|:--|
| `user_id` | NOT NULL → nullable, ondelete=SET NULL |
| `customer_name` | 신규 String(100) NOT NULL |
| `customer_phone` | 신규 String(20) NOT NULL, INDEX |
| `lookup_code` | 신규 String(6) NOT NULL, UNIQUE INDEX |

## 16. 폐기 대상

### 구조 재정의 단계 (작업 재-1)
| 경로 | 사유 |
|:--|:--|
| `artifacts/api-server/src/` | TS Express 빈 뼈대 (healthz뿐) |
| `artifacts/api-server/build.mjs` | TS 빌드 스크립트 |
| `lib/db/` | 빈 Drizzle stub |
| `lib/api-spec/` | healthz만 정의된 미동기 OpenAPI |
| `lib/api-zod/` | 미사용 코드젠 결과 |
| `lib/api-client-react/` | 미사용 코드젠 결과 |
| `pnpm-workspace.yaml` 등 | monorepo 인프라 (PM-05) |

### Auth 개편 단계 (작업 재-4.5, PM-06)
| 경로/요소 | 사유 |
|:--|:--|
| `backend/scripts/seed_admin.py` | 이메일 화이트리스트로 대체 |
| `core/security.hash_password`, `verify_password` | 로컬 가입 폐기 |
| `passlib`, `bcrypt` (requirements.txt) | 비밀번호 해시 불필요 |
| `PhoneOTP` 모델, `PhoneOTPCRUD`, `normalize_phone` | phone OTP 폐기 |
| `LocalLoginRequest`, `PhoneSendRequest`, `PhoneVerifyRequest`, `RegisterRequest` | 로컬 가입/로그인/OTP 폐기 |
| `User.username`, `User.password_hash`, `User.phone` 컬럼 | 로컬 가입 폐기 |
| `POST /api/auth/login`, `/register`, `/phone/send`, `/phone/verify` | 로컬 가입/로그인/OTP 폐기 |
| `RESERVED_USERNAMES`, `local_login`, `register`, `issue_otp`, `verify_otp` | 로컬 가입/로그인/OTP 폐기 |
| `main.py` CORS `expose_headers=["X-Dev-OTP"]` | OTP 폐기 |
| `.env`의 `ADMIN_USERNAME`, `ADMIN_PASSWORD` | 화이트리스트로 대체 |
