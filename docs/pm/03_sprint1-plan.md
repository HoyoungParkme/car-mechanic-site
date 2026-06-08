# PM-03: Sprint 1 스프린트 분해 + 계획

- 스프린트: 1
- 날짜: 2026-05-11

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-11 | [PM 직접] | data-model.md, api-spec.md 작성 후 스프린트 분해 |
| 2026-05-11 | [PM 직접] | Sprint 1을 5개 작업으로 분해 + Sprint 2 예고 |

## Sprint 1: 백엔드 도메인 아키텍처 마이그레이션

### 목표
부분 마이그된 FastAPI 코드를 도메인 아키텍처로 재구성하고, 구식 잔재(TS Express, lib/db, lib/api-spec)를 폐기하며, 보안 디폴트값을 정리한다. **기존 28개 엔드포인트는 모두 동작 보장**.

### 완료 기준

- [ ] `artifacts/api-server/python/` 폴더가 `core/` + `domains/<6개>/` 구조로 재구성됨
- [ ] auth, reservations, storage 도메인은 3레이어 (router → service → repository)
- [ ] photos, expertise, shop_info 도메인은 2레이어 (router → service)
- [ ] Alembic 도입, 초기 마이그레이션 1개 생성, `alembic upgrade head` 동작
- [ ] `docker-compose.yml`로 로컬 Postgres 동작 (`docker compose up -d postgres`)
- [ ] `.env.example` 작성, `JWT_SECRET_KEY` 미설정 시 앱 시작 거부
- [ ] SMS OTP 응답 body 평문 노출 제거, dev 모드 헤더 `X-Dev-OTP` 동작
- [ ] `/api/storage/upload-url` 폐기, `POST /api/storage/upload` (multipart)로 교체, `/uploads/*` 정적 서빙
- [ ] 구식 잔재 폐기: `artifacts/api-server/src/`, `lib/db`, `lib/api-spec`, `lib/api-zod`, `lib/api-client-react`
- [ ] 기존 프론트엔드(auto-shop)의 정상 동작 회귀 없음 (로그인·예약 등록·관리자 예약 관리)
- [ ] reviewer agent 코드 리뷰 통과, test-writer 작성 테스트 통과

### 작업 목록 (5개)

#### 작업 1: 구식 잔재 폐기 + 환경 셋업

**범위**:
- 삭제: `artifacts/api-server/src/`, `artifacts/api-server/build.mjs`, `artifacts/api-server/dist/`, `artifacts/api-server/tsconfig.json`, `artifacts/api-server/package.json`
- 삭제: `lib/db/`, `lib/api-spec/`, `lib/api-zod/`, `lib/api-client-react/`
- `pnpm-workspace.yaml` 정리 (필요 시)
- 신규: `artifacts/api-server/python/.env.example`
- 신규: `artifacts/api-server/python/docker-compose.yml` (Postgres 15)
- 신규: `artifacts/api-server/python/.gitignore` (`.venv`, `__pycache__`, `uploads/`, `.env`)
- 기존 `.replit-artifact/artifact.toml` 점검 (uvicorn 실행 명령 유지)

**검증**:
- `pnpm install` 깨지지 않음 (혹은 monorepo 정리 결과 깔끔)
- `docker compose up -d postgres` 동작
- `.env`에 `DATABASE_URL` 세팅 후 `cd python && uvicorn main:app --reload` 동작 (구조 변경 전)

#### 작업 2: core 구축 + Alembic 도입

**범위**:
- `python/core/__init__.py`
- `python/core/config.py` — pydantic-settings 기반 `Settings` (필수 변수 검증 포함)
- `python/core/database.py` — `engine`, `SessionLocal`, `Base` (기존 `database.py` 정리해서 이동)
- `python/core/security.py` — JWT (`create_access_token`, `decode_access_token`), bcrypt (`hash_password`, `verify_password`) — 기존 `auth.py`의 유틸 추출
- `python/core/deps.py` — `get_db`, `get_current_user`, `get_admin_user` (기존 `auth.py`에서 추출)
- `python/core/logging.py` — stdlib logging 단일 설정 (dev 텍스트, prod JSON 옵션) — **신규 (PM-04)**
- `python/core/errors.py` — 전역 exception handler 등록 (HTTPException/422/500) — **신규 (PM-04)**
- `python/migrations/` — Alembic 초기화, `env.py` 설정
- `alembic revision --autogenerate -m "initial schema"` 실행

**검증**:
- `alembic upgrade head` 성공
- 기존 DB는 `alembic stamp head`로 버전만 표시
- 의도적으로 422/500 트리거 시 응답 포맷이 표준 형식 (`{"detail": [...]}`, `{"detail": "internal server error"}`)

#### 작업 3: auth 도메인 마이그레이션 (3레이어) + 보안 정리

**범위**:
- `python/domains/auth/{__init__,router,service,repository,models,schemas}.py`
- `models.py`: `User`, `PhoneOTP` (기존 models.py에서 이동)
- `schemas.py`: 기존 schemas.py의 auth 관련 Pydantic 모델 이동 + `dev_otp` 응답 필드 제거
- `repository.py`: `UserRepository`, `PhoneOTPRepository`
- `service.py`: 로그인/회원가입/OTP/OAuth(google/kakao/naver) 로직 — 기존 `routers/auth.py`의 비즈니스 로직을 이리로
- `router.py`: HTTP 입출력만. `POST /api/auth/phone/send`에서 dev_otp는 응답 헤더 `X-Dev-OTP`로만 (env=dev일 때)
- 위험한 디폴트 제거: `JWT_SECRET_KEY` 없으면 `Settings`에서 ValueError (앱 시작 거부)
- `RegisterRequest` 검증: `username min_length=4`, `password min_length=8` (코드 6자/3자 → 설계대로 강화) — **PM-04**
- `python/scripts/seed_admin.py` 신규: `ADMIN_USERNAME/ADMIN_PASSWORD` env로 관리자 1개 생성, 이미 있으면 `--reset` 시 비밀번호 갱신 — **PM-04**

**검증**:
- 로컬 로그인, 회원가입(OTP 콘솔 출력 확인), 로그아웃, `/api/auth/me` 동작
- OAuth env 미설정 시 503 응답 그대로
- `cookies['access_token']` 정상 발급/삭제

#### 작업 4: reservations 도메인 마이그레이션 (3레이어)

**범위**:
- `python/domains/reservations/{__init__,router,service,repository,models,schemas}.py`
- `models.py`: `Reservation` (이동) + 인덱스 추가 (`ix_reservations_date_time`, `ix_reservations_user_date`)
- `service.py`: 권한 분기(본인/관리자), 시간대 충돌 검사 (`exists_in_slot`), 상태 전이 검증
- `repository.py`: `ReservationRepository` (find_all, find_by_user, find_by_id, exists_in_slot, save, delete)
- `router.py`: GET/POST/PUT/DELETE — 응답 형식 변경 없음
- Alembic 신규 마이그레이션: `add reservation indexes`

**검증**:
- 예약 등록 (충돌 시 409), 조회 (관리자=전체, 일반=본인), 수정/삭제 권한 분기

#### 작업 5: 단순 도메인(photos/expertise/shop_info) 2레이어 + storage 3레이어 + 로컬 어댑터

**범위**:
- `python/domains/photos/{router,service,models,schemas}.py` (2레이어)
- `python/domains/expertise/{router,service,models,schemas}.py` (2레이어)
- `python/domains/shop_info/{router,service,models,schemas}.py` (2레이어)
- `python/domains/storage/{router,service,repository,schemas}.py` (3레이어)
  - `repository.py`: `StorageRepository` Protocol + `LocalStorageRepository` — **async 통일** (`async def save(file) -> str`, `async def delete(url)`) — PM-04
  - `router.py`: `POST /api/storage/upload` (multipart), 파일 크기/확장자 검증
- `main.py`: `app.mount("/uploads", StaticFiles(directory=settings.uploads_dir))`
- 기존 GCS 코드 (`google-cloud-storage`) 제거 (requirements.txt에서도)

**검증**:
- 사진 갤러리 조회·추가·삭제 (관리자만)
- 매장 정보 조회·수정 (관리자만)
- 전문 분야 조회·CRUD
- `curl -F file=@test.jpg /api/storage/upload`로 업로드 후 `/uploads/<filename>`에서 접근 가능

### 작업 의존성

```
[1: 폐기 + 환경] ──┐
                  ▼
            [2: core + Alembic] ──┐
                  ▲               ▼
        ┌─────────┴───────────────┴────────┐
        ▼                                  ▼
[3: auth 3레이어]               [4: reservations 3레이어]
        │                                  │
        └───────────────┬──────────────────┘
                        ▼
[5: photos/expertise/shop_info 2레이어 + storage 3레이어]
```

- 작업 1, 2는 순차
- 작업 3, 4는 작업 2 완료 후 병렬 가능 (다른 도메인이므로)
- 작업 5는 작업 2 완료 후 진행 가능

### 리스크

| # | 리스크 | 심각도 | 완화책 |
|:--|:--|:--|:--|
| R-1 | Alembic 초기 마이그레이션이 기존 DB와 불일치 | 중 | `alembic stamp head`로 버전만 기록, 실제 변경은 신규 revision으로 |
| R-2 | 기존 `auth.py`의 OAuth 콜백 라우터 마이그레이션 시 redirect 동작 회귀 | 중 | 통합 테스트 (실 OAuth는 못 하므로 mock) |
| R-3 | `/api/storage/upload-url`을 호출하는 프론트가 있다면 깨짐 | 낮 | researcher 결과: 현재 호출처 없음. 안전 |
| R-4 | 기존 GCS URL이 DB에 저장된 사진 있으면 깨짐 | 낮 | 운영 DB 상태 확인 필요 [확인 필요] |
| R-5 | 파일 5개로 한 도메인 — 보일러플레이트 부담 | 낮 | 단순 도메인은 2레이어로 줄임 |

### 검증 단계 위임 (Sprint 1 종료 시점)

- **reviewer agent**: 변경 파일 전체 리뷰 (한국어 보고서)
- **test-writer agent**: pytest + httpx 테스트 작성 (도메인별 service 단위 + router 통합)
- **doc-writer agent**: `replit.md` 갱신, README 신규 (옵션)

---

## Sprint 2: 프론트엔드 Admin 탭 API 연결 (예고)

### 목표
Admin 페이지의 미연결 탭 3개를 실제 API와 연결한다. 이전엔 Demo 데이터로 동작했지만 새로고침 시 초기화되던 문제를 해결.

### 작업 (4개)

1. PhotosTab API 연결 + multipart 업로드 UI (`POST /api/storage/upload` 후 `POST /api/photos`)
2. ExpertiseTab API 연결 (GET/POST/PUT/DELETE)
3. ShopInfoTab API 연결 (GET/PUT bulk)
4. Login.tsx 정리: `dev_otp` body 읽기 → `X-Dev-OTP` 헤더로 (dev 모드 안내 UI)

### 완료 기준
- Admin 사진/기술/매장정보 3개 탭에서 추가·수정·삭제가 DB에 반영되고 새로고침에도 유지됨
- 회원가입 시 OTP 코드를 콘솔/헤더에서 확인 (dev 모드 안내 문구 표시)

---

## Sprint 3 이후 (백로그)

| 항목 | 사유 |
|:--|:--|
| SMS API 실제 연동 (NCP/Aligo 등) | 사용자 결정 필요, 유료 |
| 카카오 알림톡 비즈메시지 연동 | 유료, 비즈채널 등록 필요 |
| GCS/S3/R2 스토리지 어댑터 추가 | 운영 배포 시점에 필요 |
| OAuth 앱 등록 가이드 | Google/Kakao/Naver 콘솔 설정 |
| Replit/Cloud Run 운영 배포 | 별도 배포 스프린트 |
| 페이지네이션, 캐싱, 감사 로그 등 | 트래픽 늘어나면 |
