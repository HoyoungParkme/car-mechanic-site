# PM-15: Sprint 6 — 운영 준비 잔여 정리

- 스프린트: 6
- 날짜: 2026-05-19

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [분석] | 사용자 "잔여도 계속 작업". 백로그 5건 + B-6은 보류 |
| 2026-05-19 | [판단] | B-1(OAUTH_BASE_URL), Alembic 첫 마이그레이션, S-2/S-4/useShopInfo onError 정리. B-6 Redis는 실 배포 후 |

## 처리 범위

| # | 항목 | 처리 |
|:--|:--|:--|
| B-1 | `OAUTH_BASE_URL` env 추가, `compute_base_url` 우선순위(OAUTH_BASE_URL > replit_domains > localhost) | 코드 변경 + .env.example 가이드 |
| Alembic | 첫 마이그레이션 autogenerate | `alembic revision --autogenerate -m "initial schema"` 실행 |
| S-2 | myReservations queryKey 통일 | `["reservations", "mine"]` |
| S-4 | autofilled useRef 주석 | 의도 명시 |
| useShopInfo onError | 콘솔 로그 추가 (모니터링 도구 미도입 가정) | 간단 로깅 |
| B-6 | Redis 다중 워커 | **보류** (실 배포 후) |

## 판단 기록

### [결정] B-6은 보류

- 결정: Redis 도입은 실제 배포 후 다중 워커가 필요해진 시점에 처리
- 이유: 현재 단일 워커 가정으로 in-memory rate limit 정상 동작. 도입 비용(Redis 인프라+코드 추상화) 대비 가치는 트래픽이 있어야 발생
- 트리거: Sprint 5의 호스팅 결정 후, 워커 다중화 시점

### [결정] OAUTH_BASE_URL 정책

- 결정: `compute_base_url` 우선순위 = `OAUTH_BASE_URL` > `replit_domains` > `localhost`
- 이유: 운영 도메인이 결정되면 .env에 한 줄로 명시. Replit/localhost 자동 판정은 fallback
- 예: `OAUTH_BASE_URL=https://dreammotors.kr` → OAuth redirect_uri가 `https://dreammotors.kr/api/auth/{provider}/callback`

## 처리 결과

| 항목 | 처리 |
|:--|:--|
| B-1 OAUTH_BASE_URL | `core/config.oauth_base_url` 추가. `compute_base_url(replit_domains, oauth_base_url)` 시그니처 변경. 라우터 7곳 갱신. `.env.example`에 가이드 |
| Alembic 첫 마이그레이션 | `alembic.ini` UTF-8 호환 (한글 주석 → 영문, `timezone=UTC` 제거 — Windows tzdata 미설치 회피). SQLite 임시 환경에서 `alembic revision --autogenerate -m "initial schema"` 실행 → `migrations/versions/2a9d4566b2a7_initial_schema.py` 생성 |
| S-2 myReservations queryKey | `["my-reservations-latest"]` → `["reservations", "mine"]` (도메인 키 prefix 통일) |
| S-4 autofilled useRef 주석 | "컴포넌트 생명주기당 1회만, 언마운트→재마운트 시 재초기화" 명시 |
| useShopInfo onError | 404/500 시 `console.error("[shop-info] fetch 실패", res.status)` 추가 (Sentry 도입 자리 마련) |
| B-6 Redis | **보류** (실 배포 후 다중 워커 시) |

## 검증

- 백엔드 pytest: 136/136 통과 (회귀 없음)
- 프론트 typecheck: 통과
- Alembic 마이그레이션 파일이 SQLite로 생성됐지만 사용된 컬럼 타입(Integer/String/Boolean/DateTime/Text/ForeignKey)이 모두 portable → Postgres에서도 정상 동작

## 운영 시 안내

배포 환경에서 처음 alembic 사용 시:
```bash
# 환경: 운영 DB가 비어있는 경우 (신규 배포)
alembic upgrade head  # 자동으로 모든 테이블 생성

# 환경: 이미 데이터가 있는 경우 (기존 운영)
alembic stamp head    # 마이그레이션 버전만 기록, 스키마는 그대로
```

## Sprint 6 완료 기준

- B-1, Alembic, S-2/S-4, useShopInfo onError 정리 ✅
- 백엔드/프론트 검증 통과 ✅
- B-6은 운영 트래픽 발생 후 재검토 ✅

