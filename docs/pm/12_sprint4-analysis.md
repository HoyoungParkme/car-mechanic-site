# PM-12: Sprint 4 분석 + 결정 (백로그 정리)

- 스프린트: 4
- 날짜: 2026-05-19

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [분석 시작] | Sprint 3 완료 후 Sprint 4 진입. 사용자 "OAuth 외 전체" 지시에 따라 PM 단독 결정 진행 |

## 범위

| # | 항목 | 출처 |
|:--|:--|:--|
| B-7 | 비회원 예약 spam 차단 | PM-08 리스크 |
| B-8 | 회원의 phone 정보 + 폼 자동 채움 | PM-08 리스크 |
| S-6 | Reservation.tsx의 SERVICES 하드코딩 → expertise 연동 | reviewer 03 |

## 핵심 결정

### [결정 1] B-7: 예약 생성 rate limit (회원·비회원 공통)

- 결정: `POST /api/reservations`에 IP 기준 in-memory rate limit. 윈도우 5분, 최대 5회 (성공·실패 모두 카운트)
- 회원/비회원 구분 없이 동일 적용 (회원이라도 spam 가능)
- `core/rate_limit.py`의 `InMemoryRateLimit`를 재사용. 단 lookup용과 별개 인스턴스 (정책이 다름)
- 신설 싱글톤: `reservation_create_rate_limit` (5분/5회)
- 라우터에서 진입 시 `check`, 성공·실패 무관 `record`. 단순화: `check + record_failure` 둘 다 호출
- 이유: spam 방지 + 정상 사용자 불편 최소화. 같은 IP에서 5분 내 5회 예약은 비정상

### [결정 2] B-8: 회원 phone 자동 채움 (User 컬럼 추가 안 함)

- 결정: User에 phone 컬럼을 다시 추가하지 않음. 대신 회원 로그인 시 본인 최신 예약(`GET /api/reservations`)의 `customer_phone`/`customer_name`을 폼에 자동 채움
- 이유:
  - PM-06에서 OAuth-only로 전환하며 User.phone 명시적으로 제거. 다시 추가는 결정 회귀
  - 사용자 친화 = "지난번 예약 정보 다시 입력 안 하기"가 핵심. User 테이블 컬럼 없이도 달성 가능
  - 마이그레이션 영향 없음
- 대안 미선택: User.phone 컬럼 추가 — PM-06 결정 회귀, 마이그레이션 영향

### [결정 3] S-6: Reservation의 SERVICES = expertise.title 목록

- 결정: `Reservation.tsx`의 `SERVICES` 하드코딩 제거. `useQuery(expertise)`로 받아서 `[...expertise.map(e => e.title), "기타"]` 선택지 표시
- expertise 비어있으면 fallback 8개 (기존 SERVICES)
- 이유: Sprint 3의 "DEMO 데이터 완전 제거" 의도와 일치. 관리자가 expertise 수정하면 예약 폼도 즉시 반영

## 작업 분해

| # | 작업 | 파일 |
|:--|:--|:--|
| 1 | `reservation_create_rate_limit` 싱글톤 + 라우터 적용 | `core/rate_limit.py`, `domains/reservations/router.py` |
| 2 | 프론트: 회원 로그인 시 본인 최신 예약으로 폼 자동 채움 | `pages/Reservation.tsx` |
| 3 | 프론트: SERVICES → expertise.title + "기타" | `pages/Reservation.tsx` |
| 4 | 검증 (reviewer + test-writer) | agent 위임 |

## 리스크

| 리스크 | 영향 | 완화 |
|:--|:--|:--|
| rate limit 5회가 너무 빡빡 | 정상 사용자 불편 | 운영 시 모니터링 후 조정 (백로그) |
| 회원 최신 예약 자동 채움이 의외 동작 | UX 혼란 | 폼 input에 자동 채워졌다는 시각 표시 없이 자연스럽게 채움. 사용자가 수정 가능 |
| expertise.title 변경 시 기존 예약의 service_type과 불일치 | 데이터 분기 | service_type은 자유 문자열 컬럼이라 영향 없음 |

## 다음

설계 변경 없음 (PoC 수준). 바로 구현 → 검증.
