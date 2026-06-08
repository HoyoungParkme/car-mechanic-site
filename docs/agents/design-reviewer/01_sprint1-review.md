# DR-01: Sprint 1 설계 검증 결과

- 검증일: 2026-05-11
- 검토자: design-reviewer agent

## 요약 (3줄 이내)

문서 간 전반적 일관성은 높으나, 현재 코드와 설계 문서 사이에 몇 가지 주목할 만한 차이가 발견됐다. 보안 이슈(dev_otp body 노출, JWT 기본값, ADMIN_PASSWORD 기본값)는 설계 문서에서 모두 인지하고 있으며 Sprint 1 작업 범위에 수정 항목이 명시되어 있다. 몇 가지 스키마 불일치와 누락된 결정 사항은 PM 검토 후 보완이 권장된다.

---

## 1. 일관성 이슈

### 1-1. 문서 간 일관성

| # | 위치 A | 위치 B | 불일치 내용 | 심각도 |
|:--|:--|:--|:--|:--|
| C-1 | `tech-decisions.md §7`: dev OTP → `logger.info` + 응답 헤더 `X-Dev-OTP` | `architecture-example.md` + `api-spec.md`: 동일 | tech-decisions에서 `ENV=dev` 변수로 분기, api-spec.md는 "dev 모드만"이라고만 표현. **`ENV` 변수가 `settings.env` 인지 코드 환경변수인지 명명 통일 필요** [확인 필요] | M |
| C-2 | `api-spec.md` `StorageRepository`: `save/delete`가 `async` 메서드 | `tech-decisions.md §6` `StorageRepository`: `save/delete`가 동기 메서드 (`def save(self, file: UploadFile) -> str`) | 두 문서의 어댑터 인터페이스 시그니처가 불일치 (sync vs async) | M |
| C-3 | `api-spec.md` `ReservationUpdate`: `status` 필드 타입 `Literal["pending","confirmed","rejected","completed"] | None` | `architecture-example.md` `schemas.py` `ReservationUpdate`: `status: str | None` | 동일 설계 문서 내 두 위치에서 타입 정의가 다름 | L |
| C-4 | `api-spec.md` `PhoneVerifyRequest` 필드명: `code` | `api-spec.md` `RegisterRequest`: `otp_code` / 현재 코드 `schemas.py` `PhoneVerifyRequest`: `otp_code` | verify 요청의 필드명이 api-spec 스키마 정의와 기존 코드에서 불일치 | M |
| C-5 | `api-spec.md` `UserOut`: `oauth_provider` 필드 포함 | 현재 코드 `schemas.py` `UserOut`: `oauth_provider` 없음, `created_at` 있음 | Sprint 1에서 `UserOut`을 재정의할 때 어느 쪽을 따를지 명확화 필요 | M |
| C-6 | `api-spec.md` `ReservationOut`: `user_name`, `user_email` 없음 | 현재 코드 `schemas.py` `ReservationOut`: `user_name: Optional[str]`, `user_email: Optional[str]` 있음 | 설계 문서가 기존 코드의 필드를 누락했거나 의도적 제거인지 불명확 | M |

### 1-2. 코드 ↔ 설계 불일치 (Sprint 1 전 현황 파악용)

| # | 설계 문서 | 현재 코드 | 불일치 내용 |
|:--|:--|:--|:--|
| CC-1 | `tech-decisions.md`: `JWT_SECRET_KEY` 미설정 시 앱 시작 거부 | `auth.py:10`: `JWT_SECRET = os.getenv("JWT_SECRET_KEY", "change-me-in-production")` | 기본값 있어서 시작 거부 안 됨 — 작업 3에서 수정 예정, 인지됨 |
| CC-2 | `tech-decisions.md`: `ADMIN_PASSWORD` 기본값 제거 | `routers/auth.py:30-31`: `ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")` | 기본값 "admin" 있음 — 작업 3에서 수정 예정, 인지됨 |
| CC-3 | `api-spec.md`: `POST /api/auth/phone/send` 응답 body에서 `dev_otp` 제거 | `routers/auth.py:136`: `return {"sent": True, "dev_otp": otp_code}` | 현재 body 노출 — 작업 3에서 수정 예정, 인지됨 |
| CC-4 | `api-spec.md`: `POST /api/storage/upload` (multipart), GCS 폐기 | `routers/storage.py`: GCS 기반 `POST /api/storage/upload-url` | 작업 5에서 교체 예정, 인지됨 |
| CC-5 | `api-spec.md`: `POST /api/auth/logout` 응답 `{ok: true}` | `routers/auth.py:318`: `return {"message": "로그아웃 되었습니다."}` | 응답 형식 소폭 불일치 (기능 영향 없음) |
| CC-6 | `api-spec.md`: `POST /api/auth/register` 응답 `UserOut + 쿠키` | `routers/auth.py:201`: `return {"ok": True}` (UserOut 없음) | 설계에서는 `UserOut`을 반환하도록 변경할 예정 — Sprint 1에서 명시적으로 처리 필요 |

---

## 2. 누락/모호 항목

| # | 항목 | 심각도 | 설명 |
|:--|:--|:--|:--|
| M-1 | **로깅/관측성 미명시** | H | 어떤 로거를 쓸지(`logging`, `structlog`, `loguru` 등), 요청 로깅 미들웨어 포함 여부가 어느 문서에도 없다. 현재 코드는 `print()`로 OTP 출력 중. `tech-decisions.md`에 최소 결정 필요 |
| M-2 | **FastAPI exception handler 미명시** | H | `api-spec.md`에 에러 응답 포맷 `{"detail": "..."}` 사용이 명시되어 있으나, 전역 exception handler(`@app.exception_handler`)를 둘지 여부와 커스텀 에러 형식이 불명확. 현재 코드에도 없음 |
| M-3 | **토큰 갱신(refresh) 정책 미명시** | M | JWT 30일 만료인데 refresh 토큰이 없다. 이것이 의도된 결정이라면 `tech-decisions.md`에 "refresh 없음, 만료 시 재로그인"으로 명시 권장 |
| M-4 | **SQLAlchemy Session 라이프사이클 미명시** | M | `architecture-example.md`에 `ReservationService.__init__`에서 `db`를 직접 받는 패턴을 보여주나, 트랜잭션 경계(커밋/롤백/예외 시 세션 처리)에 대한 설명이 없다. 특히 여러 repo를 사용하는 service에서 하나의 트랜잭션으로 묶는 방법이 불명확 |
| M-5 | **CSRF 대응 명시 부재** | M | HTTP-Only 쿠키를 쓰므로 CSRF 위협이 존재한다. `SameSite=Lax`로 충분한지 여부를 문서에 명시 권장. 현재 코드 `set_cookie(samesite="lax")`는 적절하나, 설계 문서에는 언급 없음 |
| M-6 | **관리자 시드 방법 미명시** | M | `tech-decisions.md §4`: "별도 seed 스크립트"라고만 되어 있으나 seed 스크립트 경로/실행 방법이 어디에도 없다. 현재 코드는 `ADMIN_PASSWORD` 기본값 "admin"으로 로그인 시 자동 생성하는 로직을 쓰는데, 이 로직을 제거하면 관리자 계정 생성 방법이 완전히 사라진다 |
| M-7 | **`ENV` 환경변수 분기 기준 불명확** | M | `tech-decisions.md`에서 `ENV=dev`/`ENV=prod`로 분기하나, `Settings` 클래스에서 `env: str = "dev"`로 정의. `IS_DEV` 판단을 현재 코드는 `REPLIT_DOMAINS.startswith("localhost")`로 하는데, 마이그레이션 후 `settings.env`와 어떻게 통합할지 미명시 |
| M-8 | **OTP 만료 후 `is_verified=True` OTP의 register 사용 가능 여부** | L | `phone/verify`에서 `is_verified=True`로 표시하고 `register`에서 `is_verified=True AND is_used=False`를 확인. `expires_at` 체크도 다시 하는데 두 단계의 만료 정책이 일관한지 코드에서는 확인되나 설계 문서에 명시 없음 |
| M-9 | **Alembic `env.py`에서 import 경로** | L | `tech-decisions.md §3`: `core.database.Base.metadata`를 참조하도록 설명. 그러나 Alembic `env.py`는 앱과 같은 Python 환경을 공유해야 하므로 PYTHONPATH 설정 방법이 불명확. `alembic.ini`의 `script_location`, `prepend_sys_path` 설정 필요 |
| M-10 | **`uploads/` 디렉토리 자동 생성 여부** | L | `tech-decisions.md §6`과 `api-spec.md`에 `./uploads/` 사용이 명시됐으나, 디렉토리가 없을 때 자동 생성하는지 여부 미명시 (`LocalStorageRepository.save()` 구현 시 `os.makedirs(exist_ok=True)` 필요) |
| M-11 | **페이지네이션 명시적 보류 근거** | L | `api-spec.md`: "이번 스프린트에서는 도입하지 않는다 (현재 데이터량 적음)"으로 기재됨 — 현황 기록으로는 충분하나, `GET /api/reservations`의 경우 관리자는 전체 조회를 하므로 데이터가 늘어나면 문제. 파킹랏 명시 권장 |

---

## 3. 도메인 분리 코멘트

### 3-1. 6개 도메인 경계 평가

**적절하다**. 각 도메인의 경계가 명확하고 단일 책임 원칙을 따른다.

- `auth`: 인증/인가 전반. OTP, OAuth, JWT. 변경 빈도 높고 보안 민감 → 3레이어 적절
- `reservations`: 예약 생성/상태 관리. 비즈니스 규칙 밀도 높음 → 3레이어 적절
- `storage`: 파일 저장 어댑터. 구현 교체 가능성 있음 → 3레이어 적절
- `photos`, `expertise`, `shop_info`: 단순 CRUD → 2레이어 적절

### 3-2. 도메인 간 의존성 방향

**이슈 없음**. `reservations.service`가 `domains.auth.models.User`를 import하는 구조(architecture-example.md에서 확인)는 허용 가능하다. `User` 모델 자체를 import하는 것이지, auth service에 의존하지 않으므로 단방향이 유지된다.

다만 장기적으로 `User` 모델이 auth 도메인 안에 있으면 reservations → auth 도메인 의존이 생긴다. 현재 프로젝트 규모에서는 수용 가능한 트레이드오프다.

### 3-3. 혼합 레이어 적용

3레이어/2레이어 혼합은 `CLAUDE.md`의 "과한 추상화 금지" 원칙에 부합하며 합리적이다. `storage` 도메인에 `models.py`가 없는 것 (`router, service, repository, schemas`만)이 `data-model.md`에 `storage` 테이블 없음과 일치하므로 정합적이다.

---

## 4. 보안 점검 결과

| # | 항목 | 현재 상태 | 설계 문서 반영 | 판정 |
|:--|:--|:--|:--|:--|
| S-1 | `JWT_SECRET_KEY` 기본값 | `"change-me-in-production"` 하드코딩 | 작업 3에서 `min_length=16` 강제 | 인지됨, 수정 예정 |
| S-2 | `ADMIN_PASSWORD` 기본값 | `"admin"` 하드코딩 | 기본값 제거 + seed 스크립트 언급 | 인지됨, seed 방법 미명시(M-6) |
| S-3 | dev_otp body 노출 | `return {"sent": True, "dev_otp": otp_code}` | 작업 3에서 헤더로 이동 | 인지됨, 수정 예정 |
| S-4 | CSRF 대응 | `SameSite=Lax` 쿠키 적용 중 | 설계 문서에 언급 없음 | `SameSite=Lax`는 동일 출처에서 CSRF 실질 차단. 충분하나 문서화 권장(M-5) |
| S-5 | CORS | `REPLIT_DOMAINS` + localhost | `settings.cors_origins` 추상화 예정 | 적절. 단 `allow_origins=["*"]` 금지 명시 권장 |
| S-6 | OTP 브루트포스 | 없음 (attempts 컬럼 파킹랏) | `data-model.md` 파킹랏 D-1에 명시 | 인지됨. 운영 전 반드시 추가 필요 |
| S-7 | password 최소 길이 | 현재 코드: 6자(`len(body.password) < 6`) | `api-spec.md` `RegisterRequest`: `min_length=8` | **불일치** — 설계는 8자, 코드는 6자. 작업 3에서 8자로 통일 필요 |
| S-8 | username 최소 길이 | 현재 코드: 3자(`len(username) < 3`) | `api-spec.md` `RegisterRequest`: `min_length=4` | **불일치** — 설계는 4자, 코드는 3자. 작업 3에서 4자로 통일 필요 |
| S-9 | HTTP-Only 쿠키 | `httponly=True`, `secure=COOKIE_SECURE` | `tech-decisions.md` 명시 | 적절 |

---

## 5. 스프린트 분해 코멘트

### 5-1. 작업 의존성 모순

없음. 의존성 그래프가 DAG(방향성 비순환)이고 명시적으로 그려져 있다.

### 5-2. 작업 2 vs 작업 3 경계

**명확하다**. 작업 2는 `core/`(공통 유틸), 작업 3은 `domains/auth/`(비즈니스). `auth.py`에서 JWT/bcrypt 유틸은 `core/security.py`로, `get_current_user`는 `core/deps.py`로, OAuth/OTP 비즈니스 로직은 `domains/auth/service.py`로 이동하는 분리가 명확하게 기술됐다.

### 5-3. 작업 5 규모 평가

**다소 크다**. photos(2레이어) + expertise(2레이어) + shop_info(2레이어) + storage(3레이어)를 한 작업으로 묶었다. 각각은 단순하나 합치면 파일 수가 많다. 병렬 진행이 가능하다면 `작업 5a: 단순 도메인 3개` / `작업 5b: storage 어댑터`로 분리하면 진행 추적이 더 용이하다. 단일 개발자라면 현재 분해도 수용 가능하다.

### 5-4. 검증 단계 위임 명시

**확인됨**. `03_sprint1-plan.md`의 "검증 단계 위임" 항목에 reviewer / test-writer / doc-writer agent 위임이 명시되어 있다.

### 5-5. 누락된 체크 항목

- **작업 4에서 예약 `DELETE` 구현**: `api-spec.md`에 `DELETE /api/reservations/{id}` 204 명시됨. 작업 4 범위에 repository의 `delete()` 메서드가 포함되어 있으나 `architecture-example.md`의 router 예시에서 DELETE 예시가 없다. 구현 시 참고 코드 부재 — 작업자가 직접 작성해야 함(낮은 위험).
- **작업 5에서 `POST /api/photos` Body**: `PhotoCreate{url, caption?, sort_order?}`. `storage/upload` 후 URL을 받아서 photos에 저장하는 2-step 흐름인데, 이 연계 흐름이 작업 5 범위에 명시적으로 기술되면 좋다(Sprint 2 Admin 탭 연결에서 실제 사용됨).

---

## 6. 추천 사항 (우선순위 순)

| 우선순위 | 항목 | 근거 |
|:--|:--|:--|
| 1 | **관리자 시드 방법 명시** (M-6) | `ADMIN_PASSWORD` 기본값 제거 후 관리자 계정 생성 방법이 빠지면 운영 환경에서 블로킹 이슈 발생 가능 |
| 2 | **StorageRepository async/sync 통일** (C-2) | `api-spec.md`와 `tech-decisions.md`에서 메서드 시그니처 불일치. 구현 전 결정 필요. FastAPI 라우터에서 `async def`를 쓴다면 repository도 async가 자연스러움 |
| 3 | **`PhoneVerifyRequest` 필드명 통일** (C-4) | `code` vs `otp_code` 불일치. 프론트 코드 `pages/Login.tsx`가 현재 어느 필드명을 쓰는지 확인 후 통일. 필드명 변경 시 프론트 동시 수정 필요 |
| 4 | **`UserOut` 필드 정의 확정** (C-5, C-6) | `oauth_provider` 포함 여부, `created_at` 포함 여부, `user_name`/`user_email` 포함 여부를 api-spec.md에서 확정 후 구현 |
| 5 | **로거 결정 명시** (M-1) | Python 표준 `logging` 모듈 사용으로도 충분. `core/config.py` 또는 `main.py`에서 `logging.basicConfig()` 수준이면 되나, OTP `print()`를 `logger.info()`로 교체하는 것은 작업 3에서 명시적으로 포함 필요 |
| 6 | **refresh token 없음을 문서에 명시** (M-3) | 의도된 결정이라면 `tech-decisions.md §4`에 한 줄 추가로 나중 혼란 방지 |
| 7 | **CSRF/SameSite 정책 명시** (M-5) | `tech-decisions.md §4`에 "SameSite=Lax로 CSRF 위협 완화" 한 줄 추가 권장 |
| 8 | **`ENV` 변수 vs `IS_DEV` 판단 기준 통일** (M-7) | 마이그레이션 후 `settings.env == "dev"` 단일 기준으로 통일하고 `REPLIT_DOMAINS` 기반 IS_DEV 로직 제거 여부 명시 |

---

## 7. 결론

- [x] **일부 수정 후 진행 권장**

**즉시 수정이 필요한 항목은 없으나**, 아래 2개는 Sprint 1 구현 착수 전 PM이 결정/보완하기를 권장한다:

1. **관리자 시드 방법 명시** (M-6): seed 스크립트 경로와 실행 방법을 `tech-decisions.md` 또는 별도 파일에 작성
2. **StorageRepository 메서드 async/sync 통일** (C-2): `tech-decisions.md §6`과 `api-spec.md`에서 한 쪽으로 통일

나머지 불일치(C-4 PhoneVerifyRequest 필드명, C-5 UserOut 필드 정의, C-6 ReservationOut user_name/user_email)는 작업 3/4 착수 시 구현자가 코드를 보고 최종 결정하면 된다. 설계 전체 방향은 올바르고 스프린트 분해도 적절하므로 **그대로 진행 가능**한 수준이다.
