# R-01: 프로젝트 현황 조사 결과

- 위임일: 2026-05-11
- 완료일: 2026-05-11
- 스프린트: 1

## 요약

- 실제 동작 백엔드는 **FastAPI(`artifacts/api-server/python/`)** 다. TS Express(`src/`)는 `/api/healthz`만 있는 뼈대.
- FastAPI는 6개 도메인(auth, reservations, photos, expertise, shop_info, storage) 총 28개 엔드포인트 구현됨.
- DB는 SQLAlchemy + Postgres가 단독 사용. `lib/db`(Drizzle)는 빈 stub.
- `lib/api-spec/openapi.yaml`은 healthz만 정의됨 → **OpenAPI 코드젠 체계와 실제 구현이 완전 분리** (사실상 미사용).
- 프론트는 모든 API 호출을 **fetch 직접 호출**로 처리 (코드젠 hook 미사용). 일부 Admin 탭(사진/기술/매장정보)은 Demo 데이터로만 동작 (API 미연결).

## 1. 도메인별 엔드포인트 매핑 (FastAPI 기준)

| 도메인 | 엔드포인트 수 | 주요 메서드 | 인증 |
|:--|:--|:--|:--|
| health | 1 | `GET /api/healthz` | 없음 |
| auth | 13 | login / register / phone(send,verify) / oauth (google,kakao,naver) / me / logout | 일부 |
| reservations | 4 | GET/POST/PUT/DELETE `/api/reservations` | `get_current_user` |
| photos | 3 | GET / POST / DELETE `/api/photos` | 쓰기는 admin |
| expertise | 4 | GET / POST / PUT / DELETE `/api/expertise` | 쓰기는 admin |
| shop_info | 2 | GET / PUT `/api/shop-info` | 쓰기는 admin |
| storage | 2 | POST `/upload-url`, GET `/objects/{id}` | 일부 admin |

TS Express는 health 1개 외 전부 미구현.

## 2. DB 스키마 (SQLAlchemy, `python/models.py`)

| 테이블 | 핵심 컬럼 |
|:--|:--|
| `users` | id, oauth_provider, oauth_id, email, name, profile_image, is_admin, username(unique), password_hash, phone, created_at |
| `phone_otps` | id, phone(idx), otp_code, is_verified, is_used, created_at, expires_at |
| `reservations` | id, user_id(FK), date, time_slot, service_type, vehicle_model, vehicle_number, notes, status, rejection_reason, is_completed, is_paid, kakao_notified, created_at |
| `photos` | id, url, caption, sort_order, created_at |
| `expertise_items` | id, title, description, icon_name, sort_order, created_at |
| `shop_info` | id, key(unique), value |

- 마이그레이션 도구 없음 → `Base.metadata.create_all()` + 수동 `ADD COLUMN IF NOT EXISTS` (`main.py:13-36`). 예외 전부 무시 (`except: pass`).
- `lib/db/src/schema/index.ts` = `export {}` 한 줄, 사실상 미사용.

## 3. API 컨트랙트 흐름

```
lib/api-spec/openapi.yaml  (healthz 1개)
       ↓ orval
lib/api-zod, lib/api-client-react  (코드젠 결과 — 사용 안 됨)

artifacts/api-server/python  → FastAPI 자체 OpenAPI(/openapi.json, /docs)
artifacts/auto-shop/src      → fetch 직접 호출 (생성 hook 미사용)
```

- 문제: 스펙·코드·코드젠이 따로 놀고 있음. 단일 진실 소스 결정 필요.

## 4. 프론트엔드 페이지 ↔ API 매핑

| 페이지 | 호출 API | 비고 |
|:--|:--|:--|
| Home | (없음) | 모든 콘텐츠 하드코딩 |
| Login | `/api/auth/login`, `/api/auth/phone/send`, `/api/auth/phone/verify`, `/api/auth/register`, `/api/auth/{google\|kakao\|naver}` 리다이렉트 | fetch 직접 |
| Layout/useAuth | `/api/auth/me`, `/api/auth/logout` | React Query (me만) |
| Reservation | `POST /api/reservations` | fetch 직접 |
| Admin > 예약 | `GET /api/reservations` (60s 폴링), `PUT /api/reservations/{id}` | 연결 완료 |
| Admin > 사진/기술/매장정보 | **API 미연결, Demo 데이터** | 새로고침 시 초기화 |
| 어디서도 | `/api/storage/*` | 호출처 없음 |

- 인증: JWT를 HTTP-Only 쿠키(`access_token`, 30일)로 보관. 모든 요청 `credentials: 'include'`.
- 관리자 권한: `user.is_admin` + 서버는 `get_admin_user` 의존성.

## 5. 외부 의존 & 환경

| 항목 | 상태 |
|:--|:--|
| PostgreSQL | 필수. `DATABASE_URL` 없으면 즉시 KeyError |
| JWT | 동작. `JWT_SECRET_KEY` 미설정 시 기본값 `"change-me-in-production"` |
| 관리자 계정 | 환경변수 `ADMIN_USERNAME`/`ADMIN_PASSWORD` (기본 `admin`/`admin`) |
| Google/Kakao/Naver OAuth | 코드 구현됨, 환경변수 미설정 시 503 |
| SMS OTP | **미구현**. dev 모드에서 OTP를 응답 body에 평문 반환 (`routers/auth.py:136`) |
| 카카오 알림톡 | **미구현**. `kakao_notified` 컬럼만 존재, UI에도 안내 문구 있음 |
| GCS (Google Cloud Storage) | 코드 구현됨, 환경변수 미설정 시 503 |
| Replit | `.replit-artifact/artifact.toml`이 uvicorn 실행을 정의 (포트 8080) |

## 6. 실행 흐름

- `artifacts/api-server/.replit-artifact/artifact.toml:13` → `cd python && uvicorn main:app --host 0.0.0.0 --port 8080 --reload`
- 프론트: `artifacts/auto-shop` → Vite dev (vite.config 프록시 설정 없음, Replit 게이트웨이로 `/api`를 8080으로 라우팅 추정 [확인 필요])

## 7. 마이그레이션 리스크

| # | 리스크 | 심각도 |
|:--|:--|:--|
| 1 | `DATABASE_URL` 없으면 즉시 크래시 | 높 |
| 2 | dev_otp가 응답 body로 노출 | 높 |
| 3 | `JWT_SECRET_KEY` 기본값 | 높 |
| 4 | `ADMIN_PASSWORD` 기본값 `"admin"` | 높 |
| 5 | Admin 사진/기술/매장정보 탭이 Demo 상태 | 중 |
| 6 | SMS OTP 미구현 | 중 |
| 7 | OpenAPI spec-구현 동기화 없음 (코드젠 무력화) | 중 |
| 8 | run_migrations() 예외 전부 무시 | 낮 |
| 9 | OTP 만료 체크 일관성 | 낮 |
| 10 | GCS 서명 URL 서비스 계정 키 필요 | 낮 |

## 8. 유저 확인 필요 사항 (PM이 질문할 후보)

1. Admin 사진/기술/매장정보 탭을 실제 API와 연결할지 (현재 Demo 상태)
2. SMS OTP 실제 발송 서비스 선택 (NCP/Aligo/Twilio…) — 이번 스프린트 포함?
3. OAuth 앱 등록 여부 (Google/Kakao/Naver)
4. 카카오 알림톡 연동 — 이번 범위?
5. 사진 업로드 스토리지 — GCS 유지? 다른 곳?
6. Home 페이지 콘텐츠 동적화 여부
7. TS Express 코드 폐기/유지 결정
8. 도메인 아키텍처 적용 깊이 (router→service→repository 3레이어? router→service 2레이어?)

## 핵심 경로

- FastAPI 진입점: `artifacts/api-server/python/main.py`
- 라우터: `artifacts/api-server/python/routers/`
- 모델: `artifacts/api-server/python/models.py`
- 스키마: `artifacts/api-server/python/schemas.py`
- 인증 유틸: `artifacts/api-server/python/auth.py`
- DB: `artifacts/api-server/python/database.py`
- artifact.toml: `artifacts/api-server/.replit-artifact/artifact.toml`
- 프론트 라우터: `artifacts/auto-shop/src/App.tsx`
- Admin 페이지: `artifacts/auto-shop/src/pages/Admin.tsx`
- useAuth: `artifacts/auto-shop/src/hooks/useAuth.ts`
- (미사용) Drizzle stub: `lib/db/src/schema/index.ts`
- (미동기) OpenAPI: `lib/api-spec/openapi.yaml`
