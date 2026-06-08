# 테스트 작성 보고서

## 작성 대상

- 테스트 대상 파일: `backend/domains/photos/service.py`, `backend/domains/photos/router.py`
- 테스트 파일: `backend/tests/domains/photos/test_service.py` (신규)
- 테스트 프레임워크: pytest + anyio (`@pytest.mark.anyio`)

## 작성한 테스트 요약

| 테스트 대상 | 정상 | 에러 | 경계값 | 엣지 | 합계 |
|:--|:--|:--|:--|:--|:--|
| `PhotoService.delete` — DB+storage 동시 삭제 | 1 | 0 | 0 | 0 | 1 |
| `PhotoService.delete` — 외부 URL skip | 1 | 0 | 0 | 0 | 1 |
| `PhotoService.delete` — photo_id 없음 404 | 0 | 1 | 0 | 0 | 1 |
| `PhotoService.delete` — storage 예외 시 DB 삭제 유지 | 0 | 0 | 0 | 1 | 1 |
| `PhotoService.delete` — storage 예외 시 warning 로그 | 0 | 0 | 0 | 1 | 1 |
| `DELETE /api/photos/{id}` — 비로그인 401 | 0 | 1 | 0 | 0 | 1 |
| `DELETE /api/photos/{id}` — 일반 사용자 403 | 0 | 1 | 0 | 0 | 1 |
| `DELETE /api/photos/{id}` — 관리자 204 | 1 | 0 | 0 | 0 | 1 |
| `DELETE /api/photos/{id}` — 없는 ID 404 | 0 | 1 | 0 | 0 | 1 |
| **합계** | **3** | **4** | **0** | **2** | **9** |

## 주요 설계 결정

### FakeStorage 구현
`StorageCRUD` Protocol을 구현하는 `FakeStorage` 클래스를 사용했다. `raise_on_delete=True` 옵션으로 예외 주입이 가능하고, `deleted_urls` 리스트로 호출 여부와 인자를 기록한다. `unittest.mock` 없이 순수 Fake 클래스로 구현해 가독성을 높였다.

### async 테스트 패턴
기존 `tests/domains/storage/test_crud.py`의 `@pytest.mark.anyio` 패턴을 그대로 따랐다. pytest-asyncio strict 모드 환경에서 `anyio` 백엔드가 `[asyncio]` 파라미터로 수집된다.

### 라우터 통합 테스트의 storage override
`DELETE /api/photos/{id}` 라우터는 내부적으로 `PhotoService`를 생성하면서 `LocalStorageCRUD`를 주입한다. 실제 파일 I/O 없이 테스트하기 위해 `app.dependency_overrides[_service]`에 `FakeStorage`를 주입한 `PhotoService`를 반환하는 함수를 등록했다. 테스트 종료 후 `app.dependency_overrides.pop(_service, None)`으로 정리해 다른 테스트에 영향을 주지 않는다.

## 테스트 실행 결과

- 전체 (신규): 9개
- 통과: 9개
- 실패: 0개
- 스킵: 0개

### 전체 스위트 결과
- 기존: 113개 → 신규 포함 **122개 통과** (0 실패)

## 커버하지 못한 부분

- `PhotoService.create` 및 `list_all` — Sprint 3 변경 대상 아님. 별도 요청 시 추가 가능.
- `storage.delete` 호출 후 실제 파일이 사라지는지 검증 — `LocalStorageCRUD`는 별도 `test_crud.py`에서 이미 커버됨.

## 테스트 실행 명령어

```bash
# photos 테스트만 실행
cd backend && python -m pytest tests/domains/photos/ -v

# 전체 실행
cd backend && python -m pytest -v
```
