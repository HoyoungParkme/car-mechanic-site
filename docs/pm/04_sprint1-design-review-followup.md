# PM-04: Sprint 1 설계 검증 후속 결정

- 스프린트: 1
- 날짜: 2026-05-11

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-11 | [위임→design-reviewer] | 설계 5문서 교차 검증 + Mermaid 다이어그램 5개 생성 |
| 2026-05-11 | [완료←design-reviewer] | 결론: 일부 수정 후 진행 권장. 결과 → docs/agents/design-reviewer/01_sprint1-review.md |
| 2026-05-11 | [PM 직접] | 검증 결과 종합 + 보완 결정 6개 기록 |

## design-reviewer 결과 요약

| 항목 | 심각도 | PM 조치 |
|:--|:--|:--|
| **관리자 시드 방법 미명시 (M-6)** | 즉시 | PM 결정 — 별도 스크립트 (아래 §1) |
| **StorageRepository async/sync 불일치 (C-2)** | 즉시 | PM 결정 — async 통일 (아래 §2) |
| 로깅 도구 미명시 (M-1) | H | stdlib logging (§3) |
| 전역 exception handler 미명시 (M-2) | H | core/errors.py 신규 (§4) |
| Refresh token 부재 명시 안 됨 (M-3) | M | "사용 안 함" 명시 (§5) |
| password 최소 길이 (코드 6자 vs 설계 8자) | L | 설계대로 8자 (§6) |
| username 최소 길이 (코드 3자 vs 설계 4자) | L | 설계대로 4자 (§6) |
| 기타 코드↔설계 불일치 | — | Sprint 1 작업 3 범위에 이미 포함 |

## 판단 기록 (보완 결정)

### §1. [결정] 관리자 시드 — 별도 스크립트

- 결정: `artifacts/api-server/python/scripts/seed_admin.py` 신규 작성
  - 환경변수 `ADMIN_USERNAME`, `ADMIN_PASSWORD`(또는 CLI 인자) 읽어서 관리자 계정 1개 생성 (`oauth_provider="local"`, `is_admin=True`)
  - 이미 존재하면 비밀번호만 갱신 (`--reset` 플래그)
  - `python -m scripts.seed_admin` 또는 `python scripts/seed_admin.py`로 실행
- 이유: 환경변수 의존하면서 자동 생성하던 기존 방식은 위험(인덱싱·중복·디폴트 admin/admin 등). 명시적 명령으로 분리하면 운영 안전성↑
- 대안: 첫 실행 시 자동 생성 — 안 함. 사유: 환경변수 누락 시 admin 계정 만들지 못해 시스템 락아웃, 디폴트 비밀번호 유출 위험
- 대안: 회원가입 후 DB UPDATE — 안 함. 사유: 운영자가 SQL 직접 만지는 흐름 불편, 휴먼 에러
- 적용 범위: **작업 3 (auth 도메인 마이그레이션)에 포함**

### §2. [결정] StorageRepository — async로 통일

- 결정: `async def save(self, file: UploadFile) -> str`, `async def delete(self, url: str) -> None`
- 이유: FastAPI `UploadFile.read()`는 async이므로 호출부도 async가 자연스럽다. 로컬 파일 쓰기는 내부에서 동기 호출(`anyio.to_thread.run_sync` 또는 그냥 동기)이어도 인터페이스는 async로 통일
- 대안: 동기 통일 — 안 함. 사유: UploadFile 비동기 흐름과 충돌, 추후 S3/GCS 어댑터는 거의 async라 다시 바꿔야 함
- 적용 범위: **작업 5 (storage 도메인 마이그레이션)에 포함**. `tech-decisions.md`, `api-spec.md`, `architecture-example.md` 모두 async로 표기 정렬

### §3. [결정] 로깅 — stdlib `logging`

- 결정: Python 표준 `logging` 모듈 + `core/logging.py`에서 단일 설정
  - dev: 컬러 텍스트 포매터 (level + logger + msg)
  - prod (env=prod): JSON 한 줄 (선택, 차후 도입 가능)
  - uvicorn 로거를 같은 핸들러로 통합
- 이유: 무료, 의존성 추가 없음, FastAPI/uvicorn 기본 호환
- 대안: loguru — 안 함. 사유: 의존성 추가, FastAPI 표준 흐름과 약간 어긋남
- 대안: structlog — 안 함. 사유: 학습 비용, 현재 트래픽 수준에서 과함
- 적용 범위: **작업 2 (core 구축)에 포함**

### §4. [결정] 전역 Exception Handler — `core/errors.py`

- 결정: FastAPI `app.add_exception_handler`로 다음 핸들러 등록
  - `HTTPException`: 기본 동작 유지 (`{"detail": "..."}`), 단 로그에 요청 경로 기록
  - `RequestValidationError`(422): 필드별 에러를 `{"detail": [{"field": ..., "message": ...}]}` 형태로 정리 (기존 nested → flat)
  - `Exception` (500): 내부 스택은 로깅, 응답은 `{"detail": "internal server error"}` (정보 누출 방지)
- 이유: API 응답 일관성 + 운영 시 민감한 정보 누출 방지
- 적용 범위: **작업 2 (core 구축)에 포함**

### §5. [결정] Refresh Token — 사용 안 함

- 결정: 액세스 토큰 30일 만료 단일 토큰. Refresh 흐름 도입하지 않음
- 이유: 현재 트래픽 수준에서 단순성 우선. 30일이면 일반 사용자는 거의 재로그인 안 함. 만료 시 프론트가 401 받으면 로그인 페이지로 리다이렉트
- 대안: refresh + access 분리 — 안 함. 사유: 토큰 회전·refresh 보관 위치(쿠키 vs 메모리)·blacklist 등 부가 작업 발생. ROI 낮음
- 트레이드오프: 30일 토큰 탈취 시 폭로 윈도가 길다. 향후 로그아웃 블랙리스트 도입 검토 (파킹랏)
- 적용 범위: **명시만 — 코드 변경 없음**. tech-decisions.md에 기록

### §6. [결정] password / username 검증 — 설계대로

- 결정: `RegisterRequest` Pydantic 검증
  - `username`: `min_length=4, max_length=50`
  - `password`: `min_length=8`
- 이유: 보안 기준 강화 + 설계 문서 일관성 확보. 기존 가입자는 영향 없음 (해시는 그대로)
- 운영 영향: 기존에 3자 username·6자 password로 가입한 사용자가 있다면 로그인은 가능 (검증은 가입 시만). 신규 가입만 새 기준 적용
- 적용 범위: **작업 3 (auth 도메인 마이그레이션) 안에서 schemas.py 작성 시**

## 스프린트 plan 변경 사항 (요약)

- **작업 2 (core + Alembic)**: + `core/logging.py`, `core/errors.py` 신설
- **작업 3 (auth)**: + `scripts/seed_admin.py` 신설, `RegisterRequest` 검증 기준 8자/4자
- **작업 5 (단순 도메인 + storage)**: storage 어댑터 인터페이스를 async로 통일

상세한 plan 수정본은 `docs/pm/03_sprint1-plan.md`의 작업 2/3/5 섹션 업데이트로 반영.

## 결론

design-reviewer가 지적한 즉시 처리·H 심각도 항목을 모두 처리했다. 큰 재설계 없이 작업 2/3/5에 보완 항목만 추가하면 된다. **구현 단계 진입 준비 완료**.
