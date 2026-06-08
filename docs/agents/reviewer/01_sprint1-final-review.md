# Reviewer-01: Sprint 1 최종 리뷰

- 위임일: 2026-05-12
- 완료일: 2026-05-12
- 스프린트: 1

## 종합 판단

**수정 권장** (배포 전 C-1, W-1 ~ W-3 처리 권장)

치명적: 1건 / 주의: 3건 / 개선 권장: 6건

## 리뷰 대상

- `backend/domains/auth/` (router, service, crud, models, schemas, utils, __init__)
- `backend/core/` (config, security, deps, errors, logging)
- `backend/main.py`, `backend/database.py`
- `backend/migrations/env.py`
- `backend/.env.example`, `backend/requirements.txt`
- `frontend/src/pages/Login.tsx`, `frontend/src/hooks/useAuth.ts`

## 잘 작성된 부분

1. **OAuth-only 잔재 코드 완전 제거** — `passlib`, `hash_password`, `verify_password`, `PhoneOTPCRUD`, `seed_admin.py` 등 PM-06 대상이 실제 코드에서 사라짐. requirements.txt에도 passlib 없음
2. **화이트리스트 이중 정규화** — `config._split_admin_emails`에서 저장 시 소문자 변환 + `service._is_whitelisted`에서 비교 시 `.strip().lower()` 재처리
3. **500 스택 트레이스 차단** — `errors.unhandled_exception_handler`가 고정 문자열만 반환, 스택은 로그에만
4. **파일 업로드 보안 기본기** — 확장자 화이트리스트(.jpg/.jpeg/.png/.webp) + 5MB 크기 제한
5. **레이어 분리 일관성** — router→service→crud 방향 모든 도메인에서 유지. router에서 직접 `db.query` 없음
6. **Pydantic v2 패턴** — `ConfigDict(from_attributes=True)`, `field_validator(mode="before")` 일관 사용

## 치명적 (Critical)

### C-1. httpx 외부 API 호출 시 네트워크 예외 미처리

- **파일**: `backend/domains/auth/utils.py:38,45,62,69,86,93`
- **문제**: `token_resp.json()`/`user_resp.json()`을 `try/except` 없이 호출. `httpx.ConnectTimeout`/`httpx.ReadTimeout`/`httpx.ConnectError` 같은 네트워크 예외가 그대로 전역 핸들러로 흘러가 사용자에게 500 응답
- **권장 조치**: 각 fetch 함수를 `try/except httpx.HTTPError`로 감싸 `return {}` 처리. 적어도 `raise_for_status()` 호출하고 provider 에러를 서버 로그에 기록

## 주의 (Warning)

### W-1. Naver state 값 검증 누락

- **파일**: `backend/domains/auth/router.py:126,131`
- **문제**: `state=dreammotors` 고정 문자열로 보내고 콜백에서 받은 state 검증 안 함. 공격자가 임의 state로 콜백 호출 가능 (CSRF 방어 불완전)
- **권장 조치**: 단기적으로 `naver_callback`에서 `if state != "dreammotors": raise HTTPException(400)`. 장기적으로 세션/서명 토큰 기반 state. Google/Kakao는 state 미전송 — OAuth 2.0 권고 무시 (Sprint 2 후순위)

### W-2. `compute_base_url` 로컬 포트 하드코딩

- **파일**: `backend/domains/auth/utils.py:21`
- **문제**: `localhost` 판정 시 `http://localhost:80` 반환. Vite 기본 `:5173`, CRA `:3000`과 불일치 가능. provider 콘솔 등록 redirect_uri 매칭 어려움
- **권장 조치**: 운영 환경 redirect_uri를 `.env`로 명시(`OAUTH_BASE_URL` 등) 또는 `settings.port` 활용

### W-3. `datetime.utcnow()` deprecation

- **파일**: `domains/auth/models.py:30`, `core/security.py:29`, `domains/reservations/models.py:30`, `domains/expertise/models.py:17`, `domains/photos/models.py:16`
- **문제**: Python 3.12+에서 deprecation warning. naive datetime 반환으로 비교 연산 미묘한 버그 가능
- **권장 조치**: `datetime.now(timezone.utc)` 또는 `datetime.now(UTC)`로 교체

## 개선 권장 (Suggestion)

### S-1. `core/__init__.py` docstring에 "bcrypt" 잔재
- **파일**: `backend/core/__init__.py:7` — "security: JWT, bcrypt" → "security: JWT"

### S-2. `backend/scripts/__init__.py` docstring에 seed_admin 잔재
- **파일**: `backend/scripts/__init__.py:3` — `seed_admin.py` 삭제됐으므로 docstring 정리 또는 파일 자체 삭제

### S-3. `frontend/src/components/ui/input-otp.tsx` 미사용
- **파일**: `frontend/src/components/ui/input-otp.tsx` — OTP 폐기됐으나 컴포넌트 잔존. `package.json`의 `input-otp` 패키지도 검토

### S-4. `anyio`가 requirements.txt에 명시되지 않음
- **파일**: `domains/storage/crud.py:11`이 `anyio.to_thread` 사용. uvicorn[standard] 간접 의존 → 명시 권장

### S-5. `ReservationUpdate.status` 자유 문자열
- **파일**: `domains/reservations/schemas.py:19` — `Literal[...] | None` 또는 Enum으로 제약

### S-6. `pydantic[email]` 의존성 실제 미사용
- **파일**: `requirements.txt:9` — `EmailStr` 사용 안 함. `pydantic`으로 변경 가능 (향후 이메일 검증 필요 시 복귀)

## 도메인 아키텍처 평가

- 의존성 방향 단방향 유지
- `reservations/crud.py`에서 `User` JOIN 목적 import — 현 규모 허용
- service에서 HTTPException 직접 raise — FastAPI 관행, 과설계 회피 적절

## 보안 평가

- 인증 쿠키: `httponly=True`, `samesite="lax"`, secure 환경 분기 적절
- CORS: 명시적 origin 목록 (`*` 미사용) + `allow_credentials=True` 적절 조합
- 시크릿 노출: 없음 (전역 핸들러 스택 차단, OAuth client_secret 응답 미포함)
- SQL: ORM 파라미터 바인딩 일관 사용
- IDOR: `_assert_owner_or_admin` 검증
- **[확인 필요]** Kakao 이메일 동의 항목 OFF 시 `email=None` → 화이트리스트 매칭 불가. `.env.example`에 안내 추가 권장

## 체크리스트 요약

| 항목 | 결과 |
|:--|:--|
| 네이밍 | 이상 없음 |
| 함수 설계 | 이상 없음 |
| 에러 처리 | C-1 (httpx 네트워크 예외) |
| 보안 | W-1 (Naver state) |
| 구조/아키텍처 | 이상 없음 |
| 타입 | W-3 (utcnow deprecated) |
| 성능 | 이상 없음 |
| OAuth-only 일관성 | S-1, S-2, S-3 잔재 (주석/미사용 파일) |
