# PM-08: Sprint 2 분석 + 기술 결정 (비회원 예약)

- 스프린트: 2
- 날짜: 2026-05-12

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-12 | [분석 시작] | 유저: "Sprint 2 진행해줘. 너의 판단으로 다 만든 다음 보고하면 피드백" |
| 2026-05-12 | [판단] | PM 단독 결정으로 Q1·Q2·Q3 + 백로그 동반 처리(B-4)까지 모두 진행 |
| 2026-05-12 | [분석→설계] | REQ-03 기술 결정 확정, 설계 문서 갱신으로 진입 |

## 핵심 결정

### [결정 1] 예약번호 형식 = 짧은 영숫자 코드 (lookup_code, 6자리)

- 결정: Reservation에 `lookup_code String(6) UNIQUE NOT NULL` 컬럼 추가. 알파벳 대문자+숫자(헷갈리는 0/O/1/I/L 제외) 6자리 무작위 생성, 충돌 시 재생성
- 형식 예: `A3K7QX` (사람이 발음/입력 쉽도록 하이픈 없이 6자리)
- 이유: 회원/비회원 모두 동일 식별자. id 노출은 추측 가능 + 비회원 조회의 보안이 약해짐
- 대안 미선택: `id` 그대로 — 무차별 대입에 너무 취약. 회원 ID 추측 + phone 무작위 매칭 시도 가능

### [결정 2] 비회원 조회 보안 = 단순 매칭 + IP rate limit

- 결정: `phone + lookup_code` 매칭 + 같은 IP에서 **5분 윈도우 내 10회 실패** 시 차단 (in-memory 카운터)
- 이유: 단순한 도용 시도 차단. 토큰 방식은 UX 부담 큼 (사용자가 별도 값을 보관해야 함)
- 대안 1: 짧은 토큰(lookup_token) — 보관 부담, 휴대폰 분실 시 조회 불가
- 대안 2: rate limit 없음 — 6자리 코드(약 56^6=3.1B 조합)이지만 발급된 코드 수가 늘어나면 무차별 대입 위협 증가. 차라리 처음부터 차단해두는 게 단순

### [결정 3] 회원 폼 수정 시 저장 = 입력값 우선

- 결정: 회원도 비회원도 폼의 `customer_name`/`customer_phone`을 Reservation에 그대로 저장. 회원의 `User.name`/`User.email`은 건드리지 않음
- 이유: "가족 차로 대신 예약" 같은 케이스가 흔함. User 정보와 예약 정보를 분리하면 운영 측면에서도 깔끔
- 대안 미선택: User 정보 우선 — 대리 예약 케이스 막힘

### [결정 4] B-4 동반 처리 — `ReservationUpdate.status` Literal 제약

- 결정: `status: Literal["pending", "confirmed", "rejected", "completed"] | None`로 제약
- 이유: Reservation을 손대는 김에 함께 처리. 30초 작업
- 영향: 잘못된 status 값 422 응답으로 거절 (현재는 자유 문자열 허용)

### [결정 5] Reservation 모델 변경 사항

| 컬럼 | 변경 |
|:--|:--|
| `user_id` | NOT NULL → **nullable** (FK 유지, ondelete=SET NULL) |
| `customer_name` | **신규** String(100) NOT NULL |
| `customer_phone` | **신규** String(20) NOT NULL, INDEX |
| `lookup_code` | **신규** String(6) NOT NULL, UNIQUE INDEX |

마이그레이션 시 기존 데이터는 어떻게? — Sprint 1 도입 직후 데이터가 거의 없을 것으로 가정. 백필은 `customer_name = User.name`, `customer_phone = ''`, `lookup_code = 무작위 6자리`로 처리 (운영 데이터 없으면 빈 백필).

### [결정 6] 통합 엔드포인트 — Optional Auth

| Method | Path | 인증 | 비고 |
|:--|:--|:--|:--|
| POST | /api/reservations | optional | 비로그인이면 customer_*만으로 가능, 로그인이면 user_id 자동 연결 |
| GET | /api/reservations/lookup?phone=&code= | 없음 | rate limit 적용 |
| GET | /api/reservations | 인증 필수 | 회원: 본인 / 관리자: 전체 (기존 유지) |
| PUT | /api/reservations/{id} | 인증 필수 | 회원: 본인 / 관리자: 전체 (기존 유지) |
| DELETE | /api/reservations/{id} | 인증 필수 | 위와 동일 |
| DELETE | /api/reservations/lookup?phone=&code= | 없음 | 비회원 취소. rate limit 적용. status=rejected로 변경 (취소 표시) |

비회원 취소는 hard delete가 아니라 `status=rejected`로 변경 — 슬롯은 비우지만 운영자가 이력 확인 가능.

### [결정 7] 핵심 보안 정책

- `lookup_code`는 `secrets.choice` 사용 (cryptographic)
- rate limit은 IP 기준. 프록시 뒤에 있으면 `X-Forwarded-For`(첫 번째) 활용. 로컬은 client.host
- `customer_phone`은 저장 시 normalize (Sprint 1에서 폐기된 normalize_phone을 reservations 도메인 내부로 부활시켜 도메인 로컬 헬퍼화 — auth용이 아니라 reservation용이므로 별도 모듈)

## 새 작업 분해 (Sprint 2)

| # | 작업 | 파일 |
|:--|:--|:--|
| 1 | Reservation 모델 확장 + Alembic 마이그레이션 | `domains/reservations/models.py`, `migrations/versions/<new>.py` |
| 2 | 비회원 예약 생성 흐름 | `schemas.py`, `service.py`, `router.py` |
| 3 | lookup_code 생성 + 충돌 회피 | `service.py` (헬퍼 또는 `utils.py`) |
| 4 | 비회원 조회/취소 + IP rate limit | `service.py`, `router.py`, `core/rate_limit.py`(신규) |
| 5 | 프론트엔드 통합 폼 + 결과 화면 + 조회 페이지 | `Reservation.tsx`, `ReservationLookup.tsx`(신규), `App.tsx` |
| 6 | 검증: reviewer + test-writer | agent 위임 |

## 리스크

| 리스크 | 영향 | 완화 |
|:--|:--|:--|
| in-memory rate limit이 여러 워커에 분산되면 효과 미미 | 운영 시 무차별 대입 차단 약화 | Sprint 2는 단일 프로세스 가정. 운영 다중 워커 시 Redis 도입 검토 (백로그) |
| 비회원 예약 spam | DB 노이즈, 슬롯 무한 점유 | 첫 단계는 비회원 예약 자체에 rate limit 없음. 시간대 충돌 검사로 슬롯 점유는 1건/슬롯. 필요 시 추가 (백로그) |
| 기존 회원의 phone 정보가 없음 (PM-06로 컬럼 삭제) | 회원 폼 자동 채움 못 함 | 폼은 빈값으로 두고 사용자가 매번 입력. 회원 편의 기능은 추후 검토 (백로그) |
| Alembic 마이그레이션 첫 실제 사용 | autogenerate 누락 가능성 | 마이그레이션 생성 후 사람이 검토. 누락 시 수동 보정 |

## 다음 단계

설계 문서 갱신 → 백엔드 구현 → 프론트 구현 → 검증.
