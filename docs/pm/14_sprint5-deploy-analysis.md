# PM-14: Sprint 5 — 배포 환경 분석 (사용자 결정 대기)

- 스프린트: 5
- 날짜: 2026-05-19

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [분석] | 배포 환경 옵션 6개 비교, `docs/design/deploy-options.md` 작성 |
| 2026-05-19 | [추천] | 시나리오 A (Oracle Cloud Free ARM, Seoul) — 영구 무료, 24GB RAM, 한국 리전 |
| 2026-05-19 | [대기] | 사용자 결정 필요 — 실제 호스팅 선택, 도메인 구입, OAuth 콘솔 등록 |

## 결정 필요 사항 (사용자)

1. **호스팅 선택**: 시나리오 A (Oracle Free ARM) / B (Cloudtype $5) / 기타
2. **도메인**: 사용할 도메인 이름 + 등록처 (가비아/Cloudflare)
3. **OAuth 콘솔**: Google/Kakao/Naver Developers에 운영 도메인 redirect_uri 등록 (사용자 직접)
4. **백업 정책**: Postgres dump 주기/저장 위치
5. **알림톡 도입 여부**: 별도 결정 (월 1.5~2만원 추가)

## PM 후속 작업 (사용자 결정 후)

1. 사용자가 선택한 환경에 맞춰 배포 스크립트/Dockerfile/CI 작성
2. `core/rate_limit` 다중 워커 환경이면 Redis 도입 (B-6)
3. `compute_base_url` 운영 redirect_uri 정책 갱신 (B-1)
4. Alembic 첫 마이그레이션 생성 + stamp head
5. `.env.example`에 운영 가이드 추가

## 백로그 잔여 (사용자 결정과 함께)

- B-1 운영 redirect_uri (운영 도메인 결정 후)
- B-6 Redis (다중 워커 결정 시)
- Alembic 첫 마이그레이션 (배포 시점)
- OAuth 실 키 셋업 (사용자 직접)
- 카카오 알림톡 (사용자 결정)
