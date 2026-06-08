# PM-07: Sprint 1 완료 + 후속 백로그 정리

- 스프린트: 1
- 날짜: 2026-05-12

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-12 | [완료←reviewer] | "수정 권장" — C-1(httpx 예외), W-1(Naver state), W-2(localhost 포트), W-3(utcnow), S-1~6 |
| 2026-05-12 | [완료←test-writer] | 58/58 통과. schemas date shadowing 직접 수정. ReservationService 충돌 검사 미구현 발견 |
| 2026-05-12 | [PM 판단] | 즉시 수정 3건(C-1, W-1, 충돌 검사) + 즉시 정리 3건(S-1, S-2, S-3) + 운영 노트(.env Kakao 안내). 나머지 W-2/W-3/S-4~6은 백로그 |
| 2026-05-12 | [PM 직접] | C-1 처리: `utils.py`의 3개 OAuth fetch를 try/except httpx.HTTPError로 감싸고 warning 로그 추가 |
| 2026-05-12 | [PM 직접] | W-1 처리: `_NAVER_STATE` 상수 + `naver_callback`에서 `state != _NAVER_STATE` 시 400 |
| 2026-05-12 | [PM 직접] | 충돌 검사: `ReservationCRUD.find_by_slot` 추가 (status != 'rejected'), `ReservationService.create`에서 409 raise |
| 2026-05-12 | [PM 직접] | S-1: `core/__init__.py` "JWT, bcrypt" → "JWT" |
| 2026-05-12 | [PM 직접] | S-2: `scripts/__init__.py` docstring을 PM-06 변경 반영하여 갱신 |
| 2026-05-12 | [PM 직접] | S-3: `frontend/src/components/ui/input-otp.tsx` 삭제 + `package.json`에서 `input-otp` 제거 |
| 2026-05-12 | [PM 직접] | 운영 노트: `.env.example`에 Kakao 이메일 동의 안내 추가 |
| 2026-05-12 | [PM 직접] | pytest 재실행: 58/58 통과 (회귀 없음) |
| 2026-05-12 | [Sprint 1 완료] | 완료 기준 모두 달성. 다음 스프린트 준비 |

## 처리 결과 요약

### 즉시 처리 완료

| 등급 | # | 내용 | 처리 |
|:--|:--|:--|:--|
| Critical | C-1 | httpx 네트워크 예외 미처리 | 3개 fetch 함수 try/except + 로깅 |
| Warning | W-1 | Naver state 검증 누락 | `_NAVER_STATE` 상수 + 콜백 검증 |
| Test-W | - | Reservation 시간대 충돌 검사 미구현 | `find_by_slot` + `create`에서 409 |
| Suggestion | S-1 | core docstring bcrypt 잔재 | 정리 |
| Suggestion | S-2 | scripts docstring seed_admin 잔재 | PM-06 변경 반영 |
| Suggestion | S-3 | input-otp.tsx 미사용 | 파일·패키지 제거 |
| 운영 노트 | - | Kakao 이메일 동의 필요 | `.env.example`에 안내 추가 |

### 백로그로 이동 (Sprint 2 이후 검토)

| 등급 | # | 내용 | 이유 |
|:--|:--|:--|:--|
| Warning | W-2 | `compute_base_url` 로컬 포트 하드코딩 | 운영 redirect_uri 정책 결정 필요. 단순 패치 아닌 환경별 설정 설계 사안 |
| Warning | W-3 | `datetime.utcnow()` deprecation | 6개 파일 변경. 동작 영향 없는 경고이므로 단독 처리 권장 |
| Suggestion | S-4 | `anyio` 미명시 | uvicorn 간접 의존으로 동작. 명시화는 의존성 정책과 함께 |
| Suggestion | S-5 | `ReservationUpdate.status` Literal 제약 | 상태 머신 정비와 함께 처리 (Sprint 2/3) |
| Suggestion | S-6 | `pydantic[email]` 미사용 | 향후 EmailStr 사용 가능성 검토 후 결정 |

## 판단 기록

### [결정] 후속 6건을 백로그로 분리

- 결정: W-2, W-3, S-4~S-6은 Sprint 1에 포함하지 않고 백로그(파킹랏)로 이동
- 이유:
  - 모두 동작 차단 요소가 아님 (실패 테스트 없음, 보안 직접 노출 없음)
  - 일부는 운영 정책(W-2 운영 redirect_uri) 또는 코드 정책(S-5 상태 머신 정비)과 묶여 단독 처리하면 의미가 흐려짐
  - Sprint 1의 핵심 목표(도메인 아키텍처 + OAuth-only 개편)는 즉시 처리 3건으로 완전히 충족
- 대안: 모두 Sprint 1에 포함 — 작업 분량이 늘어 스프린트 종료가 늦어지고, W-3는 6개 파일 동시 변경으로 회귀 위험

### [Sprint 1 완료 기준 충족 체크]

| 완료 기준 | 결과 |
|:--|:--|
| 구조 재정의 (backend/, frontend/) | ✅ |
| 6도메인 분해 + 레이어 적용 | ✅ |
| Alembic 도입 | ✅ |
| docker-compose Postgres | ✅ |
| JWT_SECRET_KEY 미설정 시 시작 거부 | ✅ |
| 로컬 스토리지 + /uploads 정적 서빙 | ✅ |
| 구식 잔재 폐기 (Replit/monorepo/TS) | ✅ |
| OAuth-only 인증 (PM-06) | ✅ |
| 기존 OAuth 콜백 동작 유지 | ✅ |
| reviewer/test-writer 검증 통과 | ✅ (58/58 + 치명적 이슈 처리) |
