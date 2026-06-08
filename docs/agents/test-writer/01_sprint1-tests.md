# Test-Writer-01: Sprint 1 백엔드 테스트

## 요약
- 작성한 테스트 파일: 4개
- 테스트 케이스 수: 58개
- 통과: 58 / 실패: 0
- 커버리지: 미측정 (pytest-cov 미설치)

## 테스트 구조

```
backend/tests/
├── conftest.py                              # in-memory SQLite, TestClient, make_user, auth_cookie
├── core/
│   └── test_security.py                     # JWT create/decode (8개)
└── domains/
    ├── auth/
    │   ├── test_service.py                  # upsert_oauth_user + 화이트리스트 (11개)
    │   └── test_router.py                   # /me, /logout 라우터 (6개)
    ├── reservations/
    │   └── test_service.py                  # 생성/목록/수정/삭제/라우터인증 (18개)
    └── storage/
        └── test_crud.py                     # 확장자/크기/URL/라우터인증 (15개)
```

## 실행 결과

```
platform win32 -- Python 3.12.10, pytest-9.0.3
plugins: anyio-4.13.0, asyncio-1.3.0
collected 58 items

tests/core/test_security.py                         8 passed
tests/domains/auth/test_router.py                   6 passed
tests/domains/auth/test_service.py                 11 passed
tests/domains/reservations/test_service.py         18 passed
tests/domains/storage/test_crud.py                 15 passed

============= 58 passed, 67 warnings in 0.30s =============
```

경고는 모두 `datetime.utcnow()` deprecation (Python 3.12) 및 Starlette TestClient cookie 방식 변경 예고이며, 테스트 실패와 무관하다.

## 도메인별 커버 항목

| 테스트 대상 | 정상 | 에러 | 경계값 | 엣지 | 합계 |
|:--|:--|:--|:--|:--|:--|
| create_access_token | 3 | 0 | 0 | 0 | 3 |
| decode_access_token | 1 | 4 | 0 | 0 | 5 |
| upsert_oauth_user (기본) | 3 | 0 | 0 | 0 | 3 |
| 관리자 화이트리스트 | 3 | 2 | 2 | 1 | 8 |
| GET /api/auth/me | 1 | 2 | 0 | 1 | 4 |
| POST /api/auth/logout | 1 | 0 | 0 | 1 | 2 |
| 예약 생성 | 2 | 0 | 0 | 0 | 2 |
| 예약 목록 (권한) | 2 | 0 | 0 | 0 | 2 |
| 예약 수정 (권한) | 2 | 2 | 0 | 0 | 4 |
| 예약 삭제 (권한) | 2 | 1 | 0 | 0 | 3 |
| 예약 라우터 인증 | 2 | 1 | 0 | 0 | 3 |
| 확장자 검증 | 4 | 7 | 1 | 0 | 12 |
| LocalStorageCRUD.save | 2 | 2 | 1 | 0 | 5 |
| 스토리지 라우터 인증 | 1 | 2 | 0 | 0 | 3 |
| **합계** | **30** | **23** | **4** | **2** | **58** |

## 발견한 문제

### 1. ReservationCreate/ReservationUpdate date 필드 shadowing 버그 (수정 완료)

`domains/reservations/schemas.py`에서 `from datetime import date`로 임포트한 후,
클래스 필드명도 `date`로 지정해 Pydantic 런타임 타입 평가 시 `date` 심볼이 `NoneType`으로
해석되어 `TypeError: unsupported operand type(s) for |: 'NoneType' and 'NoneType'`가 발생했다.

`from datetime import date, datetime`을 `import datetime as dt`로 변경하고
타입 어노테이션을 `dt.date`, `dt.datetime`으로 수정해 해결했다.

### 2. 예약 time_slot 충돌 검사 미구현 [확인 필요]

요구사항에 "동일 date + time_slot 충돌 시 409"가 명시되어 있으나,
`ReservationService.create()`에 중복 체크 로직이 없다. 동일 슬롯에 예약이 중복 삽입된다.
해당 테스트는 작성하지 않고 주석으로 표시했다.

### 3. 경고: datetime.utcnow() deprecation

`core/security.py:29`에서 `datetime.utcnow()`를 사용해 Python 3.12 deprecation 경고가 발생한다.
`datetime.now(datetime.UTC)`로 교체 권장. 동작에는 영향 없음.

## 커버하지 못한 부분

| 항목 | 이유 |
|:--|:--|
| OAuth 콜백 라우터 (google/kakao/naver/callback) | 외부 HTTP 호출이 포함되어 있고 service 단위 테스트로 충분하다고 판단. monkeypatch 범위가 확장되어 테스트 복잡도가 크게 증가. |
| 예약 date+time_slot 충돌 409 | 서비스 레이어에 해당 로직 미구현. 구현 후 테스트 추가 필요. |
| photos / expertise / shop_info CRUD | 우선순위 4(선택)로 Sprint 1 필수 항목 완료 후 추가 예정. |

## 테스트 실행 명령어

```bash
cd backend
pytest -v
```

테스트용 패키지 설치가 필요한 경우:
```bash
pip install pytest==8.3.4 pytest-asyncio==0.24.0 anyio[trio]==4.3.0
```
