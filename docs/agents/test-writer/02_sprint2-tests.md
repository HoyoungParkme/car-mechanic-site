# Test-Writer-02: Sprint 2 reservations 갱신 + 신규 케이스 + rate_limit + utils

## 요약

- 갱신 파일: 1개 (`tests/domains/reservations/test_service.py`)
- 신규 파일: 2개 (`tests/core/test_rate_limit.py`, `tests/domains/reservations/test_utils.py`)
- 테스트 케이스 수 (전체): 113개 (Sprint 1 기준 58개 → Sprint 2 후 113개)
- 통과: 113 / 실패: 0
- 커버리지: 미측정 (pytest-cov 미설치)

## 테스트 구조

```
backend/tests/
├── conftest.py                                    # 변경 없음
├── core/
│   ├── test_security.py                            # 변경 없음 (8개)
│   └── test_rate_limit.py                          # 신규 (16개)
└── domains/
    ├── auth/
    │   ├── test_service.py                         # 변경 없음 (11개)
    │   └── test_router.py                          # 변경 없음 (6개)
    ├── reservations/
    │   ├── test_service.py                         # 갱신 + 대거 확장 (41개, 기존 18개)
    │   └── test_utils.py                           # 신규 (16개)
    └── storage/
        └── test_crud.py                            # 변경 없음 (15개)
```

## 실행 결과

```
platform win32 -- Python 3.12.10, pytest-9.0.3
plugins: anyio-4.13.0, asyncio-1.3.0
collected 113 items

tests/core/test_rate_limit.py                      16 passed
tests/core/test_security.py                         8 passed
tests/domains/auth/test_router.py                   6 passed
tests/domains/auth/test_service.py                 11 passed
tests/domains/reservations/test_service.py         41 passed
tests/domains/reservations/test_utils.py           16 passed
tests/domains/storage/test_crud.py                 15 passed

============= 113 passed, 102 warnings in 0.45s =============
```

## 회귀 수정 내역

### 실패 원인 및 수정 방법

| 실패 테스트 | 원인 | 수정 |
|:--|:--|:--|
| `test_create_reservation_returns_reservation_out` | `ReservationCreate`에 `customer_name`/`customer_phone` 필수 추가됨 | `make_reservation_body()`에 두 필드 기본값 추가 |
| `test_create_reservation_default_status_is_pending` | 동일 | 동일 |
| `test_admin_sees_all_reservations` | 동일 | 동일 |
| `test_regular_user_sees_only_own_reservations` | 동일 | 동일 |
| `test_owner_can_update_own_reservation` | 동일 | 동일 |
| `test_admin_can_update_any_reservation` | 동일 | 동일 |
| `test_other_user_cannot_update_reservation_raises_403` | 동일 | 동일 |
| `test_update_nonexistent_reservation_raises_404` | 동일 | 동일 |
| `test_owner_can_delete_own_reservation` | 동일 | 동일 |
| `test_other_user_cannot_delete_reservation_raises_403` | 동일 | 동일 |
| `test_admin_can_delete_any_reservation` | 동일 | 동일 |
| `test_create_reservation_returns_401_when_not_logged_in` | `POST /api/reservations`가 Optional Auth로 변경 → 비로그인 시 401이 아닌 422(body 검증 오류) | 기존 테스트 삭제 후 비로그인 201 케이스로 재작성 |
| `test_create_reservation_returns_201_when_logged_in` | `customer_name`/`customer_phone` 누락으로 422 반환 | body에 필수 필드 추가 |

## 신규 테스트 목록

### test_service.py 신규 추가 (23개)

| 테스트 | 분류 |
|:--|:--|
| `test_create_reservation_with_no_user_sets_user_id_none` | 비회원 예약 생성 |
| `test_create_reservation_lookup_code_is_6_chars_from_valid_pool` | lookup_code 형식 |
| `test_create_reservation_lookup_code_differs_across_calls` | lookup_code 무결성 |
| `test_create_reservation_with_user_stores_form_customer_info` | 대리 예약 허용 |
| `test_create_reservation_raises_409_on_duplicate_slot` | 시간대 충돌 409 |
| `test_create_reservation_lookup_code_retries_on_collision` | 충돌 시 재시도 |
| `test_lookup_returns_reservation_on_match` | 비회원 조회 정상 |
| `test_lookup_normalizes_phone_before_search` | phone 정규화 조회 |
| `test_lookup_raises_404_on_wrong_code` | 조회 실패 404 |
| `test_lookup_raises_404_on_wrong_phone` | 조회 실패 404 |
| `test_cancel_sets_status_to_rejected` | 취소 정상 |
| `test_cancel_is_idempotent` | 취소 멱등성 |
| `test_cancel_raises_404_on_wrong_code` | 취소 실패 404 |
| `test_create_reservation_returns_201_without_login` | 비로그인 POST 201 |
| `test_create_reservation_returns_422_when_customer_name_missing` | 필수 필드 누락 422 |
| `test_create_reservation_returns_422_when_customer_phone_missing` | 필수 필드 누락 422 |
| `test_lookup_returns_200_on_match` | GET /lookup 200 |
| `test_lookup_returns_404_on_mismatch` | GET /lookup 404 |
| `test_lookup_returns_429_after_10_failures` | rate limit 429 |
| `test_delete_lookup_returns_200_cancelled_true` | DELETE /lookup 200 |
| `test_delete_lookup_is_idempotent` | DELETE /lookup 멱등성 |
| `test_delete_lookup_returns_404_on_wrong_code` | DELETE /lookup 404 |
| `test_update_with_invalid_status_returns_422` | Literal 422 (B-4) |
| `test_update_with_valid_status_returns_200` | Literal 정상 200 |

### test_utils.py 신규 (16개)

| 테스트 클래스 | 테스트 | 분류 |
|:--|:--|:--|
| `TestNormalizePhone` | 하이픈 제거 | 정상 |
| | 공백 제거 | 정상 |
| | 하이픈+공백 혼합 제거 | 정상 |
| | 구분자 없는 경우 그대로 | 경계값 |
| | 앞뒤 공백 제거 | 경계값 |
| | 국가코드(+82) 보존 | 엣지 |
| | 빈 문자열 입력 → 빈 문자열 | 경계값 |
| | 하이픈만 있는 입력 → 빈 문자열 | 경계값 |
| `TestGenerateLookupCode` | 반환 타입이 문자열 | 정상 |
| | 길이 6자리 | 정상 |
| | 허용 풀 문자만 포함 (100회 반복) | 정상 |
| | 헷갈리는 문자 제외 (1000회 반복) | 엣지 |
| | 대문자만 포함 | 정상 |
| | 반복 호출 시 다른 값 | 엣지 |
| | 풀 중복 문자 없음 | 경계값 |
| | 풀 크기 31자 (소스 주석 오류 확인) | 경계값 |

### test_rate_limit.py 신규 (16개)

| 테스트 클래스 | 테스트 | 분류 |
|:--|:--|:--|
| `TestCheck` | 임계치 미만 통과 | 정상 |
| | 임계치 도달 시 429 | 에러 |
| | 임계치 초과 시 429 | 에러 |
| | 다른 IP 격리 | 엣지 |
| | 처음 보는 IP 통과 | 정상 |
| `TestSlidingWindow` | 윈도우 밖 실패 무시 (time.monotonic mock) | 엣지 |
| | 윈도우 경과 후 새 실패 반영 | 엣지 |
| | check()가 오래된 실패 정리 | 엣지 |
| `TestReset` | reset 후 차단 해제 | 정상 |
| | 없는 IP reset 시 예외 없음 | 경계값 |
| | reset 후 내부 딕셔너리에서 키 제거 | 정상 |
| `TestGetClientIp` | X-Forwarded-For 첫 번째 값 반환 | 정상 |
| | X-Forwarded-For 없을 때 client.host | 정상 |
| | client도 None이면 'unknown' | 경계값 |
| | X-Forwarded-For 공백 제거 | 엣지 |
| | X-Forwarded-For 단일 값 | 경계값 |

## 테스트 케이스 집계

| 테스트 대상 | 정상 | 에러 | 경계값 | 엣지 | 합계 |
|:--|:--|:--|:--|:--|:--|
| test_service.py (reservations) | 17 | 12 | 4 | 8 | 41 |
| test_utils.py (normalize_phone) | 2 | 0 | 4 | 2 | 8 |
| test_utils.py (generate_lookup_code) | 4 | 0 | 2 | 2 | 8 |
| test_rate_limit.py (check) | 2 | 2 | 0 | 1 | 5 |
| test_rate_limit.py (sliding window) | 0 | 0 | 0 | 3 | 3 |
| test_rate_limit.py (reset) | 2 | 0 | 1 | 0 | 3 |
| test_rate_limit.py (get_client_ip) | 2 | 0 | 2 | 1 | 5 |
| **Sprint 2 신규/갱신 합계** | **29** | **14** | **13** | **17** | **73** |

## 발견한 문제

### 1. `_LOOKUP_CHARS` 소스 주석 오류

`domains/reservations/utils.py` 13번째 줄 주석이 "30자 풀"이라고 기재되어 있으나 실제 문자열 `ABCDEFGHJKMNPQRSTUVWXYZ23456789`의 길이는 31자다. 동작에는 영향 없으나 문서 불일치. 주석 수정 권장.

### 2. rate_limit 싱글톤 테스트 격리

`lookup_rate_limit` 싱글톤이 모든 테스트에서 공유되므로 `autouse=True` fixture로 각 테스트 전후 `_failures.clear()`를 호출해 격리했다. `test_service.py`에 fixture를 추가하지 않으면 `test_lookup_returns_429_after_10_failures`가 다른 테스트 실패 기록을 오염시킬 수 있다.

## 커버하지 못한 부분

| 항목 | 이유 |
|:--|:--|
| `lookup_rate_limit` 5회 재시도 전부 실패 시 500 | `_LOOKUP_CODE_MAX_RETRY=5`번 모두 충돌 재현이 복잡하고 운영상 발생 가능성 0에 가까움. mock으로 작성 가능하나 우선순위 낮음. |
| rate_limit 멀티스레드 동시성 | 단일 워커 가정. Lock 동작은 유닛 테스트로 검증 어려움. |
| `list_all_with_user`에서 비회원(user_id=None) 예약 포함 확인 | 관리자 조회 목록에 비회원 예약이 포함되는지 직접 검증 코드 추가 가능. 현재 서비스 레벨 테스트로 간접 커버. |

## 테스트 실행 명령어

```bash
cd backend
pytest -v
```

특정 파일만 실행:

```bash
pytest tests/domains/reservations/test_service.py -v
pytest tests/domains/reservations/test_utils.py -v
pytest tests/core/test_rate_limit.py -v
```
