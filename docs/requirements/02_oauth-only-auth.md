# REQ-02: OAuth-only 인증 정책 + 관리자 화이트리스트

- 요청일: 2026-05-12
- 상태: ❌ 폐기 (Sprint 7, 2026-05-19 — 시나리오 X 전환)
- 스프린트: 1 (검증 직전 끼워넣음)

## 요청 원문

> 지금보니깐 전화번호 회원가입은 하지 말자. pass 인증도 돈 엄청 나갈것 같아
> 카톡 로그인이랑 구글 로그인 네이버 로그인 살리고 이걸 회원 예약, 비회원예약은 정보입력 후 예약으로 하자. 근데 이거 유료로 돌리면 비용발생이 어느정도 할려나
> 관리자도 Oauth로 하자.

## 핵심 목표

- 일반 사용자 회원가입은 **OAuth만** (Google / Kakao / Naver). 로컬 ID/PW 가입 폐기
- **phone OTP / PASS 본인인증 도입 안 함** (비용 회피)
- 관리자도 OAuth로 통합 + `.env` 이메일 화이트리스트로 `is_admin` 자동 부여

## 사용자 시나리오

1. 일반 사용자가 Login 페이지에서 카카오/구글/네이버 중 하나를 눌러 가입·로그인한다
2. 점주(관리자)가 동일하게 OAuth로 로그인하면 시스템이 이메일을 화이트리스트와 비교해 자동으로 `is_admin=true`로 승격한다
3. 점주 이메일이 화이트리스트에 늦게 추가되어도 다음 로그인 시 자동 승격된다

## 기능 목록

| # | 기능 | 우선순위 | 설명 | 상태 |
|:--|:--|:--|:--|:--|
| F-1 | 로컬 회원가입 제거 | 필수 | `POST /api/auth/register` 엔드포인트·service·schema 삭제 | 미시작 |
| F-2 | phone OTP 제거 | 필수 | `POST /api/auth/phone/send`, `/verify` 삭제. `PhoneOTP` 테이블·CRUD·utils 삭제 | 미시작 |
| F-3 | 로컬 로그인 제거 | 필수 | `POST /api/auth/login` 엔드포인트·service 삭제 | 미시작 |
| F-4 | User 컬럼 정리 | 필수 | `username`, `password_hash`, `phone` 컬럼 제거. `UserOut`에서도 제거 | 미시작 |
| F-5 | OAuth 콜백 유지 | 필수 | Google/Kakao/Naver 콜백은 기존대로 동작 | 완료(기존) |
| F-6 | 관리자 화이트리스트 | 필수 | `.env`의 `ADMIN_EMAILS`(콤마 구분)에 매칭되면 `is_admin=true` 자동 부여. 매 로그인 시 재평가 | 미시작 |
| F-7 | 보안 유틸 정리 | 필수 | `core/security`의 `hash_password`/`verify_password` 삭제. `passlib`/`bcrypt` 의존성 제거 | 미시작 |
| F-8 | 시드 스크립트 폐기 | 필수 | `scripts/seed_admin.py` 삭제 (화이트리스트로 대체) | 미시작 |
| F-9 | 프론트 Login UI 재작성 | 필수 | 로컬 가입/로그인 폼 전부 삭제. OAuth 버튼 3개만. 콜백 후 `/me` 호출 → `is_admin`이면 `/admin`으로 분기 | 미시작 |

## 기술 결정

- **관리자 식별 키 = email**: provider 무관하게 동일 관리자를 식별할 수 있음. OAuth ID는 provider마다 다르므로 부적합
  - 카카오: 이메일 동의 권한 필수 (Kakao Developers 콘솔에서 동의 항목 켜두기)
- **승격 시점 = 매 OAuth 로그인 시**: `upsert_oauth_user`에서 항상 화이트리스트 체크. 이메일이 화이트리스트에 있으면 `is_admin=true`로 set, 아니면 변경하지 않음
- **첫 관리자 등록 = .env**: `ADMIN_EMAILS=owner@example.com` 설정 후 점주가 OAuth 로그인하면 끝. 별도 시드 스크립트 불필요

## 비고

- 비회원 예약은 별도 요구사항(REQ-03)에서 다룸 — Sprint 2로 분리
- PASS 본인인증, SMS OTP는 **도입 안 함** (운영 비용 회피)
- 카카오 알림톡은 운영 시작 단계에서 별도 결정 (현재 코드에는 없음)
