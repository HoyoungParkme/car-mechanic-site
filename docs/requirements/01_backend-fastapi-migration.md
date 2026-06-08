# REQ-01: 백엔드 FastAPI 마이그레이션 + 도메인 아키텍처

- 요청일: 2026-05-11
- 상태: ❌ 폐기 (Sprint 7, 2026-05-19 — 시나리오 X 전환)
- 스프린트: 1

## 요청 원문

> 이 프로젝트는 내가 replit로 만든 자동차 정비소 웹사이트야. 초안은 만들었고 이제 작업을 너랑 이어서 할거야. 먼저 프로젝트를 잘 분석을 하고 그 다음에 백엔드를 fastapi로 변경을 해줘. 아키텍쳐는 도메인 아키텍쳐로 진행해줘.

## 핵심 목표

- 기존 Replit 초안의 백엔드(TS/Express)를 FastAPI로 전환한다
- 도메인 아키텍처(도메인별로 응집, 의존성 방향 통일)로 백엔드 코드를 정리한다

## 현재 상태 (초기 파악)

- 모노레포(pnpm) 구조:
  - 백엔드: `artifacts/api-server/`
    - `src/` — TS Express 5 (기존 초안)
    - `python/` — FastAPI 작업 시작 흔적 (커밋 안 됨, models·routers 등 일부 있음)
  - 프론트: `artifacts/auto-shop/` — React + Vite
  - DB 패키지: `lib/db/` — PostgreSQL + Drizzle ORM
  - API 스펙: `lib/api-spec/` (OpenAPI) → `lib/api-zod`, `lib/api-client-react` 코드젠 (Orval)
- 식별된 도메인 후보 (FastAPI python/ 기준): `auth`, `reservations`, `photos`, `expertise`, `shop_info`, `storage`
- 식별된 기능 (최근 커밋):
  - 회원가입(전화 OTP 인증)
  - ID/PW 로그인 + OAuth 소셜 로그인 + 관리자 로그인
  - 예약 관리(ERP 스타일 + 캘린더)
  - 사진 갤러리, 매장 소개

## 핵심 발견 (researcher 결과 요약)

- 실제 운영 백엔드는 이미 FastAPI다 (TS Express는 healthz만 있는 빈 뼈대)
- FastAPI는 6도메인 28엔드포인트 구현됨 (auth/reservations/photos/expertise/shop_info/storage)
- DB는 SQLAlchemy + Postgres가 단독 운영, Drizzle 스키마는 빈 stub
- OpenAPI 코드젠 체계(lib/api-spec, api-zod, api-client-react)는 사실상 미사용 (프론트는 fetch 직접 호출)
- 프론트 일부 미연결: Admin 사진/기술/매장정보 탭은 Demo 데이터, storage 업로드 UI 없음
- 외부 연동은 코드만 있고 실제 운영 안 됨: SMS OTP / 카카오 알림톡 / Google·Kakao·Naver OAuth / GCS
- 보안 디폴트값 위험: `JWT_SECRET_KEY=change-me-in-production`, `ADMIN_PASSWORD=admin`, dev_otp가 응답 body 노출
- 마이그레이션 도구 부재: `create_all()` + 수동 `ADD COLUMN IF NOT EXISTS`에 의존

## 작업 재해석

요청 표면: "백엔드를 FastAPI로 변경"
실제 본질: **부분 마이그된 FastAPI 코드를 도메인 아키텍처로 재구성 + 구식 잔재 정리 + (선택) 미연결 부분 연결**

## 명확화 질문 (유저 확인 필요)

상세는 `docs/pm/01_sprint1-analysis.md` 참고.

1. 이번 스프린트 범위 (A: 리팩토링만 / B: A + 프론트 미연결 탭 연결 / C: 외부 연동 일부 실설정 포함)
2. 도메인 아키텍처 깊이 (router+service 2레이어 vs router+service+repository 3레이어)
3. 구식 코드 정리 정책 (TS Express, lib/db, lib/api-spec, lib/api-zod, lib/api-client-react 폐기 여부)

## 기능 목록

(분석 완료 후 작성)

## 기술 결정

(설계 단계에서 작성)

## 비고

- 이미 FastAPI 코드가 부분적으로 존재 → "처음부터 새로 쓰기" 아니라 "기존 코드 → 도메인 아키텍처로 정리/확장"
- DB는 이미 Postgres 기준 운영 중 (Drizzle + SQLAlchemy 두 스키마 정의가 공존하는 상태)
