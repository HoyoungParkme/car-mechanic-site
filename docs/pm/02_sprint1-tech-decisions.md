# PM-02: Sprint 1 기술 결정 — FastAPI 도메인 아키텍처 + 무료 제약

- 스프린트: 1
- 날짜: 2026-05-11

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-11 | [분석→설계] | 분석 완료, /tech-decision 시작 |
| 2026-05-11 | [PM 직접] | docs/design/tech-decisions.md 작성 |

## 유저 응답 해석

- 원문: "진행해줘. 근데 우선 무료로 해보고 싶어."
- 해석:
  1. Q1 (스프린트 범위): 명시 없음 → **PM 판단에 위임**으로 해석 → A+B (백엔드 도메인 아키텍처 리팩토링 + Admin 미연결 탭 API 연결). C(외부 연동 실설정)는 "무료" 제약 때문에 보류
  2. Q2 (아키텍처 깊이): 명시 없음 → **PM 추천(혼합)** 채택. auth/reservations/storage는 3레이어, photos/expertise/shop_info는 2레이어
  3. "무료" 제약: 유료 외부 서비스 사용 보류 (SMS API, 카카오 알림톡, GCS). 무료 대안 사용

## 판단 기록

### [결정] 스토리지: GCS → 로컬 파일 저장

- 결정: `./uploads/` 폴더에 파일 저장, FastAPI `StaticFiles`로 `/uploads/*` 정적 서빙
- 이유: 무료 제약. GCS는 무료 등급 있지만 서비스 계정 키·버킷 설정 필요. 로컬 파일은 즉시 동작
- 대안 1: Cloudflare R2 / Supabase Storage 무료 등급 — 안 함. 사유: 추가 등록 필요, 학습 비용
- 대안 2: GCS 유지 (env 미설정 시 503) — 안 함. 사유: 사용자가 "진행"을 원하므로 즉시 동작 필요
- 추후: 어댑터 패턴으로 storage 인터페이스를 두면 운영 배포 시 S3/R2/GCS 교체 용이

### [결정] SMS OTP: 콘솔 출력 (개발 모드)

- 결정: OTP를 `logger.info`로 콘솔 출력. `ENV=dev`일 때만 응답 헤더 `X-Dev-OTP`로 노출. 운영 모드는 SMS API 호출 (코드만 준비)
- 이유: 무료 제약. 운영 SMS는 모두 유료
- 대안 1: 응답 body 평문 노출 유지 — 안 함. 사유: 보안 리스크. researcher가 지적
- 대안 2: SMS API 실제 연동 — 안 함. 사유: 비용 발생. 사용자 결정 후 진행
- 영향: 회원가입 시 사용자는 콘솔 로그 또는 응답 헤더로 OTP 확인 (개발용)

### [결정] 카카오 알림톡: 보류

- 결정: 백엔드 `kakao_notified` 컬럼 유지. UI는 "준비 중" 비활성화 또는 안내 문구만
- 이유: 카카오 비즈채널 등록 + 비즈메시지 API는 모두 유료
- 대안: 일반 카카오 메시지 API — 안 함. 사유: 비즈니스 알림용 아님, 정책 제한

### [결정] DB 마이그레이션: Alembic 도입

- 결정: `create_all + run_migrations()` 폐기 → Alembic 도입
- 이유: 현재 `except: pass`로 마이그 실패를 삼킴 — 상태 불일치 위험. 컬럼 변경 추적 불가
- 대안: 현재 방식 유지 — 안 함. 사유: 도메인 아키텍처 리팩토링과 함께 정리하는 게 효율적

### [결정] 보안 디폴트 정리

- 결정: `JWT_SECRET_KEY`, `ADMIN_PASSWORD` 미설정 시 앱 시작 거부. `.env.example` 작성
- 이유: 현재 위험한 디폴트(`change-me`, `admin`)가 운영 누출 시 즉시 탈취 위험
- 대안: 디폴트 유지 + 경고 로그 — 안 함. 사유: 경고는 무시되기 쉬움. 안전한 디폴트는 명시적 실패

### [결정] Postgres 무료 옵션

- 결정: 로컬은 Docker Compose로 Postgres 컨테이너 (Replit은 기존 환경 유지)
- 이유: 무료, 즉시 실행 가능
- 대안 1: SQLite — 안 함. 사유: 기존 운영 DB가 Postgres. 호환성 이슈(`Date`, `Text`, 트랜잭션 등)
- 대안 2: Supabase/Neon 무료 등급 — 안 함. 사유: 추가 등록 필요. 로컬 작업이 빠름. 필요 시 추후

### [결정] 폐기 대상 (Q3)

- 결정: `artifacts/api-server/src/` (TS Express), `lib/db/`, `lib/api-spec/`, `lib/api-zod/`, `lib/api-client-react/` 모두 폐기
- 이유: 유저 결정 + researcher 확인 (모두 미사용)
- 후속: `pnpm-workspace.yaml` 조정, `artifacts/api-server/package.json` 처리 (Python 패키지로 전환 또는 삭제)

### [결정] 아키텍처 깊이 (Q2)

- 결정: 도메인별 혼합
  - 3레이어 (router → service → repository): auth, reservations, storage
  - 2레이어 (router → service): photos, expertise, shop_info
- 이유: 핵심 도메인은 비즈니스 규칙·외부 어댑터·테스트 격리 필요. 단순 CRUD는 보일러플레이트만 늘어남
- 대안 1: 전부 3레이어 — 안 함. 사유: 단순 도메인의 repo 레이어는 가치 없음. CLAUDE.md "과한 추상화 금지"
- 대안 2: 전부 2레이어 — 안 함. 사유: auth/reservations는 규칙이 자라면 repo 분리가 필요한데 그때 비용 큼

## 다음 단계

- docs/design/tech-decisions.md 작성 (이번 작업)
- docs/design/data-model.md 작성 (기존 SQLAlchemy 모델 검토 + 변경분)
- docs/design/api-spec.md 작성 (도메인별 엔드포인트 + 변경 사항)
- 스프린트 분해 (Sprint 1, 2, 3 등)
- design-reviewer에게 설계 검증 + 다이어그램 생성 위임
