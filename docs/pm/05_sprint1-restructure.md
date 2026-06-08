# PM-05: Sprint 1 구조 재정의 (Replit 인프라 폐기 + backend/frontend 분리)

- 스프린트: 1
- 날짜: 2026-05-11

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-11 | [유저 요청] | "아키텍쳐 분리와 필요없는 코드들이 아직 정리가 안되었어. backend/frontend 폴더 분리. 도메인별 crud/router/model/schemas/service/utils 분리. database/main은 공통." |
| 2026-05-11 | [PM 명확화] | mockup-sandbox/모노레포/database 위치 PM 추천 제시 |
| 2026-05-11 | [유저 응답] | "replit agent들은 이제 안 쓸거니깐 삭제하고 model은 models로 변경" |
| 2026-05-11 | [판단] | Replit 인프라 전체 폐기 + 모노레포 폐기 + 평탄 구조(backend/, frontend/) + models 복수 통일 |

## 판단 기록

### [결정] Replit 인프라 전체 폐기

- 결정: 다음 모두 폐기
  - `.replit`, `.replitignore`, `replit.md`
  - `.local/`, `.agents/`
  - `attached_assets/` (Replit이 첨부 저장)
  - `artifacts/api-server/.replit-artifact/`, `artifacts/mockup-sandbox/.replit-artifact/`
  - `artifacts/mockup-sandbox/` (Replit sandbox 자체)
  - frontend의 Replit Vite 플러그인 3종 (cartographer, runtime-error-modal, dev-banner)
- 이유: 유저 결정. Replit을 더 이상 사용하지 않음
- 영향: 배포는 추후 별도 결정 (로컬·Docker·일반 PaaS)

### [결정] 모노레포 인프라 폐기

- 결정: 다음 폐기
  - `pnpm-workspace.yaml`
  - 루트 `package.json`
  - `tsconfig.json`, `tsconfig.base.json`
  - `pnpm-lock.yaml`
  - `.npmrc`
  - `scripts/` (monorepo 후크 + 미사용 TS 스크립트)
- 이유: backend(Python) + frontend(React) 단순 2폴더 구조에 모노레포 인프라는 과함
- 영향: frontend의 catalog 의존성을 실제 버전으로 풀어서 자체 package.json에 박아 넣음 → frontend는 단독 npm/pnpm 패키지

### [결정] 평탄 구조 — backend/, frontend/

- 결정:
  - `artifacts/api-server/python/` → `backend/`
  - `artifacts/auto-shop/` → `frontend/`
  - `artifacts/` 빈 폴더 삭제
- 이유: 유저 요청. 더 직관적
- backend 내부 구조:
  ```
  backend/
  ├── main.py
  ├── database.py
  ├── core/{config, security, deps, logging, errors}.py
  ├── domains/<6>/{router, service, crud, models, schemas, utils?}.py
  ├── migrations/
  ├── scripts/seed_admin.py
  ├── requirements.txt, alembic.ini, .env.example, .gitignore, docker-compose.yml
  ```

### [결정] 도메인 폴더 명명 — models (복수)

- 결정: `models.py` (단수 model 아님)
- 이유: 유저 결정. Python/SQLAlchemy 관례 부합
- 다른 파일: `router.py, service.py, crud.py, schemas.py, utils.py` (utils는 필요한 도메인만)

### [결정] database.py / main.py 위치

- 결정: `backend/database.py`, `backend/main.py`는 backend 루트
- 이유: 유저 메시지 "database, main같은건 공통으로 두고". import 경로 짧음 (`from database import Base`)
- 그 외 공통(`config, security, deps, logging, errors`)은 `backend/core/` 아래

## 새 Sprint 1 작업 분해 (재정의)

기존 작업 1·2는 완료된 결과물 그대로 사용. 새 작업 번호로 재정의:

### 작업 1 (재): Replit/monorepo 폐기 + 폴더 이동 + frontend 의존성 정리

- Replit/monorepo 인프라 파일 폐기
- `artifacts/api-server/python/` → `backend/`
- `artifacts/auto-shop/` → `frontend/`
- `artifacts/` 빈 폴더 삭제
- `frontend/vite.config.ts`에서 Replit 플러그인 3종 제거, `@assets` 별칭 제거
- `frontend/package.json`에서 Replit 의존성 제거, catalog 의존성을 실제 버전으로 풀기
- backend는 작업 2의 산출물(core/, migrations/) 그대로 옮겨감

### 작업 2 (재): 도메인 분해 (6도메인 동시)

- `backend/domains/{auth, reservations, photos, expertise, shop_info, storage}/`
- 각각 `router.py, service.py, crud.py, models.py, schemas.py`
- `utils.py`는 필요한 도메인만 (auth: OAuth 클라이언트 헬퍼)
- 기존 `routers/`, `models.py`, `schemas.py`, `database.py shim`, `auth.py shim` 모두 폐기
- `main.py`의 라우터 조립을 새 경로로 갱신
- Alembic `migrations/env.py`의 `import models`를 `import domains.*.models`로 갱신

### 작업 3: 보안 정리 + seed_admin

- `auth` 도메인 라우터에서 `dev_otp` 응답 body 제거 → `X-Dev-OTP` 헤더 (env=dev일 때만)
- `RegisterRequest`: `username min_length=4`, `password min_length=8`
- `backend/scripts/seed_admin.py` 신규

### 작업 4: storage 로컬 어댑터

- `domains/storage/crud.py`: `LocalStorageRepository` (async)
- `domains/storage/router.py`: `POST /api/storage/upload` (multipart)
- `main.py`: `app.mount("/uploads", StaticFiles(...))`
- 기존 GCS 코드 완전 제거

### 작업 5: 검증

- `reviewer` agent: 전체 백엔드 코드 리뷰
- `test-writer` agent: pytest + httpx 테스트
- 결과 보고 후 Sprint 1 완료
