# PM-06: Sprint 1 Auth 전면 개편 결정 (OAuth-only)

- 스프린트: 1
- 날짜: 2026-05-12

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-12 | [유저 요청 1] | "전화번호 회원가입 하지 말자. PASS 인증도 돈 엄청 나갈 것 같아" |
| 2026-05-12 | [PM 직접] | 현재 코드 영향 범위 조사 (auth 도메인 + frontend Login). PhoneOTP 모델/CRUD, /auth/phone/* 엔드포인트, Login.tsx phone UI 식별 |
| 2026-05-12 | [유저 요청 2] | "카톡/구글/네이버 로그인 살리고 회원/비회원예약 분리. 유료 운영 비용 어느정도?" |
| 2026-05-12 | [PM 직접] | 비용 시나리오 추산 보고: 시나리오 A(0~1.5k원), B(7k~1만원), B+(1.5~2만원), C(5~7만원). OAuth는 무료. PASS는 가입비 50~100만 + 건당 200~300원 |
| 2026-05-12 | [PM 명확화] | Q1 관리자 로그인 방식, Q2 비회원 예약 폼, Q3 비회원 조회/취소 |
| 2026-05-12 | [유저 응답] | Q1 → 관리자도 OAuth + 이메일 화이트리스트. Q2 → 회원과 동일 폼. Q3 → B(전화번호+예약번호 조회/취소) |
| 2026-05-12 | [판단] | Sprint 1에 작업 재-4.5(OAuth-only 개편) 편입. 비회원 예약(REQ-03)은 Sprint 2로 분리. 이유: auth/reservation 동시 변경은 검증이 복잡, auth는 검증 전 폐기될 코드 정리 필요 |
| 2026-05-12 | [PM 직접] | REQ-02 작성(`docs/requirements/02_oauth-only-auth.md`), REQ-03 작성(`docs/requirements/03_guest-reservation.md`), requirements.md/pm index 갱신, sprint.md 갱신 |

## 판단 기록

### [결정 1] 로컬 ID/PW 가입·로그인·관리자 로그인 모두 폐기

- 결정: `POST /api/auth/login`, `/api/auth/register`, `/api/auth/phone/send`, `/api/auth/phone/verify` 4개 엔드포인트 모두 삭제. 관련 service/schema/CRUD 모두 삭제
- 이유:
  - 유저가 명시적으로 "전화번호 회원가입 하지 말자", "OAuth만 살리자"고 결정
  - PASS 본인인증은 가입비 50~100만원 + 건당 비용으로 부담이 큼
  - SMS OTP도 가입/월정액과 건당 비용이 발생
  - OAuth(Google/Kakao/Naver)는 무료라 비용 회피에 효과적
- 대안: 로컬 로그인은 관리자용으로 유지 (Q1의 옵션 A)
- 대안 미선택 이유: 유저가 직접 "관리자도 OAuth로 하자"고 선택

### [결정 2] 관리자 식별 = 이메일 화이트리스트

- 결정: `.env`에 `ADMIN_EMAILS=owner@example.com,partner@example.com` 콤마 구분. `upsert_oauth_user`에서 매번 화이트리스트 매칭 → `is_admin` 자동 부여
- 이유:
  - provider(google/kakao/naver)가 달라도 동일 관리자 식별 가능
  - 별도 시드 스크립트나 DB 수동 조작 불필요 → 운영 단순화
  - 이메일이 화이트리스트에서 빠지면 자동으로 권한 강등 가능 (선택적: 본 스프린트에서는 강등 로직은 넣지 않음. 이메일 매칭만 true로 set)
- 대안 1: OAuth ID 화이트리스트 — provider 종속, 카카오/구글 동일 관리자 등록 시 둘 다 필요
- 대안 2: DB 직접 `is_admin` 토글 — 운영 부담 큼

### [결정 3] 관리자 권한 set-only (강등은 안 함)

- 결정: `upsert_oauth_user`에서 이메일이 화이트리스트에 있으면 `is_admin=true`로 set. 없으면 기존 값 유지(`false`든 `true`든 변경 안 함)
- 이유: 이번 스프린트는 인증 정책 폐기/이관에 집중. 강등 정책은 운영 정책이 정해진 뒤 추가
- 향후: 화이트리스트에서 빠지면 강등하는 정책이 필요하면 Sprint N에서 추가

### [결정 4] 보안 유틸 완전 제거

- 결정: `core/security`에서 `hash_password`, `verify_password` 함수 삭제. `requirements.txt`의 `passlib[bcrypt]` 의존성 제거
- 이유: 로컬 가입을 폐기하면 비밀번호를 다룰 일이 없음. 의존성/공격면 감소
- 대안: 향후 admin 비밀번호 fallback용으로 유지 — 유저가 OAuth로 통합 결정해서 불필요

### [결정 5] seed_admin.py 폐기

- 결정: `backend/scripts/seed_admin.py` 삭제. `.env`의 `ADMIN_USERNAME`, `ADMIN_PASSWORD`도 제거
- 이유: 화이트리스트 방식에서는 점주가 OAuth 로그인하기만 하면 자동 승격되므로 시드 불필요
- 대안: scripts/seed_admin.py를 이메일 화이트리스트 시드용으로 재작성 — 화이트리스트는 .env가 단일 출처이므로 시드 스크립트가 별도로 있을 필요 없음

### [결정 6] Sprint 분할 — 인증(Sprint 1) vs 비회원 예약(Sprint 2)

- 결정: 인증 개편(REQ-02)은 Sprint 1에 편입, 비회원 예약(REQ-03)은 Sprint 2로 분리
- 이유:
  - auth 도메인은 검증(reviewer/test-writer) 전에 완료해야 함. 안 그러면 폐기될 로컬 가입 코드를 검증하는 낭비 발생
  - 비회원 예약은 Reservation 모델 변경 + 새 엔드포인트 3개 + 새 UI 라우트 → Sprint 1에 더 끼우면 검증이 늦어지고 작업 범위가 비대해짐
  - 두 변경의 의존성 방향: REQ-03이 REQ-02에 의존 (회원/비회원 분기는 인증 정책 확정 후 의미가 있음)

### [결정 7] OAuth 콜백 후 admin 분기

- 결정: 콜백에서는 무조건 `/` 로 redirect. frontend가 페이지 진입 시 `/me` 호출 → `is_admin`이면 `/admin`으로 이동
- 이유:
  - 콜백 URL에 `is_admin` 쿼리스트링 노출은 어색하고 변조 가능성 있음
  - frontend가 페이지 진입마다 `/me` 호출하는 패턴이 이미 존재
- 대안: 콜백에서 직접 `/admin`으로 분기 — 콜백 함수 안에서 user.is_admin을 다시 조회해야 하고, redirect 분기가 늘어남

## 결정 요약 표

| 영역 | 결정 |
|:--|:--|
| 회원가입 | OAuth만 (Google/Kakao/Naver) |
| 로그인 | OAuth만. 로컬 `POST /api/auth/login` 삭제 |
| phone OTP | 폐기. `PhoneOTP` 테이블·엔드포인트·utils 삭제 |
| 관리자 식별 | `.env ADMIN_EMAILS` 화이트리스트, 매 로그인 시 자동 승격 |
| User 컬럼 | `username`/`password_hash`/`phone` 제거 |
| 보안 유틸 | `hash_password`/`verify_password` 제거. `passlib` 의존성 제거 |
| seed_admin | 폐기 |
| 콜백 후 분기 | 콜백은 `/`로, frontend가 `/me` 호출 후 admin 분기 |

## 비용 추산 (참고)

| 시나리오 | 구성 | 월 비용 |
|:--|:--|:--|
| A. 최소 무료 | Oracle/GCP Free Tier + 도메인 | 0~1,500원 |
| B. 소규모 (월 100건) | VPS $5~6 + 도메인 | 7,000~10,000원 |
| B+ 알림 추가 | 위 + 카카오 알림톡 100건 | 15,000~20,000원 |
| C. 중규모 (월 500건 + 알림 적극) | VPS $15 + 알림톡 500건 + 대행사 | 50,000~70,000원 |

- 본 결정으로 회피되는 비용: SMS OTP, PASS 본인인증 (가입비 50~100만 + 건당 200~300원)
- OAuth 자체는 무료 (Kakao/Google/Naver 모두)
- 카카오 알림톡은 운영 시작 시 별도 결정

## 다음 작업

1. ✅ 요구사항/PM/sprint/work-log 문서 작성
2. ✅ 설계 문서 갱신 (`tech-decisions`, `data-model`, `api-spec`, `diagrams/`)
3. ✅ 백엔드 코드 구현 (auth 도메인 정리 + core/config·security 정리 + 시드/마이그레이션 정리)
4. ✅ 프론트엔드 Login.tsx OAuth-only로 재작성
5. ✅ 검증 위임 (reviewer + test-writer) — 진행 중

## 위임 기록

| 시점 | 대상 | 내용 |
|:--|:--|:--|
| 2026-05-12 | reviewer | Sprint 1 최종 리뷰. 대상: backend/ 전체 + frontend/src/pages/Login.tsx. 결과: docs/agents/reviewer/01_sprint1-final-review.md |
| 2026-05-12 | test-writer | Sprint 1 백엔드 테스트 작성 + 실행. 결과: docs/agents/test-writer/01_sprint1-tests.md + backend/tests/ |
