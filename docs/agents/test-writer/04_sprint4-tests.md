# 테스트 작성 보고서

## 작성 대상

- 테스트 대상 파일: `backend/domains/reservations/router.py` (`create_reservation` — B-7 rate limit)
- 테스트 파일: `backend/tests/domains/reservations/test_service.py` (기존 파일에 클래스 추가)
- 테스트 프레임워크: pytest + TestClient (starlette)

## 작성한 테스트 요약

| 테스트 대상 | 정상 | 에러 | 경계값 | 엣지 | 합계 |
|:--|:--|:--|:--|:--|:--|
| `POST /api/reservations` — 같은 IP 5회까지 201 | 1 | 0 | 1 | 0 | 1 |
| `POST /api/reservations` — 같은 IP 6회째 429 | 0 | 1 | 1 | 0 | 1 |
| `POST /api/reservations` — 윈도우 경과 후 재허용 | 1 | 0 | 0 | 1 | 1 |
| `POST /api/reservations` — 다른 IP 독립 카운터 | 1 | 1 | 0 | 1 | 1 |
| **합계** | **3** | **2** | **2** | **2** | **4** |

## 주요 설계 결정

### conftest autouse fixture 활용

`conftest._reset_rate_limits`가 이미 `reservation_create_rate_limit._failures.clear()`를 처리하므로 `TestReservationCreateRateLimit` 내부에 별도 setup/teardown을 두지 않았다. 테스트 간 격리가 자동으로 보장된다.

### time_slot 분리로 409 회피

`reservation_create_rate_limit`은 매 요청마다 성공·실패 무관하게 카운트한다. 따라서 5회 연속 호출 시 동일 날짜·시간대 중복 예약 409가 먼저 발생하지 않도록 각 호출에 서로 다른 `time_slot`을 부여했다.

### time.monotonic mock 패턴

`core/rate_limit.py`가 `time.monotonic()`을 직접 호출하므로 `monkeypatch.setattr(rl_module.time, "monotonic", fake_monotonic)` 방식으로 모듈 레벨의 `time` 객체를 교체했다. Sprint 2의 `test_rate_limit.py` 패턴과 동일하다.

### X-Forwarded-For로 IP 변경

`get_client_ip`는 `X-Forwarded-For` 헤더가 있으면 그 첫 번째 값을 IP로 채택한다. TestClient는 `headers={"x-forwarded-for": "1.2.3.4"}` 형태로 헤더를 주입할 수 있으므로, 이를 이용해 IP별 카운터 독립성을 검증했다.

## 테스트 실행 결과

- 신규 추가: 4개
- 통과: 4개
- 실패: 0개
- 스킵: 0개

### 전체 스위트 결과

- 기존: 122개 → 신규 포함 **126개 통과** (0 실패)

## 커버하지 못한 부분

- 회원 로그인 상태에서도 동일 IP 차단 여부 (index.md 선택 항목 5번): 라우터 코드상 회원/비회원 구분 없이 IP 기준 카운트를 적용하므로 기존 `test_create_reservation_returns_201_when_logged_in` 테스트가 간접 커버함. 별도 케이스 추가 시 명시적으로 확인 가능.

## 테스트 실행 명령어

```bash
# rate limit 테스트 클래스만 실행
cd backend && python -m pytest tests/domains/reservations/test_service.py::TestReservationCreateRateLimit -v

# 전체 실행
cd backend && python -m pytest -v
```
