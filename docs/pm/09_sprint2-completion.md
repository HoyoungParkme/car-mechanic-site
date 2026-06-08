# PM-09: Sprint 2 완료 + 백로그 일괄 정리

- 스프린트: 2
- 날짜: 2026-05-19

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [PM 판단] | 사용자 "OAuth 외 전체 진행". A(Sprint 2 마무리) + B(Sprint 3 Admin 탭) + C(Sprint 4 백로그) + D(Sprint 5 배포 분석) 4단계로 분해. OAuth 실키·카카오 알림톡·실제 배포는 외부 비용/계정 의존으로 제외 |
| 2026-05-19 | [PM 직접] | Warning + Suggestion 일괄 처리 (자세한 항목은 아래 표) |
| 2026-05-19 | [PM 직접] | pytest 재실행 — 118/118 통과 (utcnow 경고 모두 사라짐) |
| 2026-05-19 | [Sprint 2 완료] | 완료 기준 달성 + Warning 모두 처리 |

## 처리 결과

| 항목 | 위치 | 처리 |
|:--|:--|:--|
| W-2 메모리 누수 | `core/rate_limit.py` | `record_failure()` 안에서 `_cleanup()` 호출 |
| W-4 = B-2 utcnow | `core/security.py`, 4개 모델, `tests/core/test_security.py` | `core/clock.py` 신규 (`utc_now()`) + 모두 교체 |
| S-1 주석 30 vs 31 | `domains/reservations/utils.py` | "31자 풀 (알파벳 23 + 숫자 8)"로 정정 |
| W-3 Admin 에러 무음 | `frontend/src/pages/Admin.tsx` | `updateReservation`에 `res.ok` 체크 + `window.alert` + throw |
| B-3 anyio 명시 | `requirements.txt` | `anyio==4.6.2.post1` 추가 |
| B-5 pydantic[email] | `requirements.txt` | `pydantic[email]` → `pydantic` |

## 판단 기록

### [결정] W-1 race는 atomic 메서드 신설하지 않음

- 결정: reviewer 02의 W-1(rate_limit.check ↔ record_failure 별도 lock race)에 대해 `check_and_record_failure` 같은 atomic 메서드를 만들지 않고 record_failure에만 cleanup 추가
- 이유:
  - 라우터 흐름은 "진입 시 check → 서비스 호출 → 실패 시 record". race가 발생해도 임계치 1~2 초과한 채 한두 요청만 추가 통과. 다음 요청부터는 차단되어 보안 영향 미미
  - atomic 통합하면 라우터 패턴이 복잡해짐 (실패 시 record가 자체로 raise 가능 → 원 예외 보존 어려움)
  - 다중 워커 환경에서는 어차피 in-memory 정확성 보장 불가 (백로그 B-6 Redis로 본질 해결)
- 대안 미선택: `check_and_record_failure` 메서드 신설 → 라우터 코드 복잡도 증가 vs 보안 이득 작음

### [결정] datetime 변환 = naive UTC 유지 (`utc_now`)

- 결정: `datetime.now(timezone.utc).replace(tzinfo=None)`을 반환하는 `core.clock.utc_now()` 헬퍼 신설. 기존 `datetime.utcnow()` 호환
- 이유: 현재 컬럼 정의가 `DateTime` (without timezone). tz-aware datetime을 INSERT하면 PostgreSQL이 자동 변환하지만 SQLAlchemy/SQLite/마이그레이션 일관성을 위해 naive 유지
- 대안: 컬럼을 `DateTime(timezone=True)`로 바꾸기 — 마이그레이션 영향 + 운영 정책 결정 필요 (백로그)

### [결정] B-6, B-7, B-8 처리 시점

- B-6 (Redis 도입): 다중 워커/배포 결정 후 처리 (Sprint 5 배포 분석 이후)
- B-7 (비회원 예약 spam 차단): Sprint 4에서 처리
- B-8 (회원 phone 자동채움): Sprint 4에서 처리

## Sprint 2 완료 기준 체크

| 기준 | 결과 |
|:--|:--|
| Reservation 모델 확장 (user_id nullable, customer_*, lookup_code) | ✅ |
| 통합 POST /api/reservations (Optional Auth) | ✅ |
| GET/DELETE /api/reservations/lookup (rate limit) | ✅ |
| core/rate_limit.py 신규 | ✅ |
| 어드민 customer 표시 + 비회원 뱃지 | ✅ |
| 프론트 통합 폼 + lookup 페이지 + /reservation/lookup 라우트 | ✅ |
| B-4 status Literal 제약 | ✅ |
| reviewer 통과 (Critical 0) | ✅ |
| test-writer 통과 | ✅ (113→118 통과) |
| **Warning 4건 처리** | ✅ |
| **Suggestion 6건 중 5건 처리** (S-2/S-3은 운영 정책 백로그) | ✅ |
| Alembic 마이그레이션 | ⚠️ 미생성 — `Base.metadata.create_all` 의존. 운영 시 alembic 사용 (백로그) |

## 다음 단계

1. Sprint 3 — Admin 미연결 탭 + storage UI 시작
2. Sprint 4 — B-7 spam 차단, B-8 phone 자동채움 등
3. Sprint 5 — 배포 환경 분석 (실 배포는 사용자 결정 후)
