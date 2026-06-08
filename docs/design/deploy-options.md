# 배포 환경 옵션 분석

작성: 2026-05-19 (Sprint 5)
목적: 드림모터스 사이트를 실제로 띄울 호스팅 선택지를 비교한다. **실제 결정은 사용자**.

## 요구 사항

| 항목 | 내용 |
|:--|:--|
| 구성 | FastAPI 백엔드 + React(Vite) 정적 + PostgreSQL + `/uploads` 정적 파일 |
| 도메인 | 필요 (OAuth callback에 https URL 필수) |
| SSL | 필수 (OAuth · 쿠키 secure) |
| 한국 사용자 | 가까운 리전 |
| 비용 | 무료 또는 월 1만원 이하 우선 |
| 다중 워커 | Sprint 5+에서 검토 (현재 단일 워커 가정 — B-6 Redis 필요 시) |

## 옵션 비교

### 1) Oracle Cloud Free Tier (Always Free) — **최우선 추천**

| 항목 | 내용 |
|:--|:--|
| 비용 | 0원 (영구 무료, "Always Free") |
| 리전 | Seoul 가능 |
| 스펙 | AMD VM ×2 (1/8 OCPU, 1GB RAM, 50GB) 또는 ARM Ampere (4 OCPU, 24GB RAM, 200GB) |
| Postgres | Autonomous DB 무료 (또는 VM 안에 컨테이너) |
| 외부 IP | 무료 |
| SSL | Let's Encrypt + Caddy/nginx |
| 도메인 | 별도 (가비아/Cloudflare 연 1.5만원) |
| 장점 | ARM 24GB는 강력. 영구 무료 |
| 단점 | UI 복잡, 카드 등록 필요, 가끔 무료 인스턴스 중단 사례 있음 |

### 2) Cloudtype (한국 PaaS) — **간편한 옵션**

| 항목 | 내용 |
|:--|:--|
| 비용 | Hobby Free 0원 / Lite $5 |
| 리전 | 한국 |
| 스펙 | Free 0.5 vCPU, 512MB RAM. Lite 1 vCPU, 1GB RAM |
| Postgres | Add-on (별도 비용) — Supabase 무료 티어 연동 권장 |
| SSL | 자동 |
| 도메인 | 무료 서브도메인 / 커스텀 도메인 가능 |
| 장점 | 한국어 지원, 한국 결제, Git push 자동 배포 |
| 단점 | Free는 콜드 스타트 있음 |

### 3) Render — 글로벌 PaaS

| 항목 | 내용 |
|:--|:--|
| 비용 | Free 웹서비스 + Free Postgres (90일 후 유료) / Starter $7+$7 |
| 리전 | Singapore (한국과 80~120ms) |
| 장점 | Git 푸시 자동 배포, SSL 자동, 깔끔한 UI |
| 단점 | Free Postgres 90일 후 삭제. 한국에서 멀어 약간 느림 |

### 4) Railway — 사용량 기반 PaaS

| 항목 | 내용 |
|:--|:--|
| 비용 | $5 크레딧/월부터 사용 (Hobby) |
| 리전 | 동남아 가능 |
| 장점 | 매우 빠른 셋업, Postgres 통합 |
| 단점 | 100% 무료 옵션 없음 |

### 5) Fly.io — 글로벌 분산

| 항목 | 내용 |
|:--|:--|
| 비용 | 작은 VM 무료 → 사용량 청구 |
| 리전 | NRT(도쿄), HKG(홍콩) 가능 |
| 장점 | 글로벌 엣지 |
| 단점 | 무료 한도 좁고 정책 자주 변경 |

### 6) VPS 직접 운영 (Vultr/Lightsail/DigitalOcean)

| 항목 | 내용 |
|:--|:--|
| 비용 | $4~6/월 (약 6~9천원) |
| 리전 | Seoul/Tokyo |
| 장점 | 가장 저렴+예측 가능. 단일 VM에 backend+frontend+Postgres+nginx 모두 |
| 단점 | OS 직접 관리. SSL/방화벽/백업/로그 수동 |

## 권장 시나리오

### 시나리오 A — 무료로 시작 (강력 추천)

- 인프라: **Oracle Cloud Free ARM (24GB RAM, Seoul)**
- DB: 같은 VM에 docker compose Postgres
- 정적: nginx로 frontend `dist/` + `/uploads` 서빙 + backend proxy
- SSL: Caddy 자동 (Caddyfile 한 줄)
- 도메인: 가비아 또는 Cloudflare ~1.5만원/년 (월 환산 1.3k원)
- **월 비용: 1.3k원 (도메인비만)**

### 시나리오 B — 가장 간편 (한국 PaaS)

- 인프라: **Cloudtype Lite ($5)**
- DB: Supabase Free (500MB) 또는 Cloudtype Postgres add-on
- 정적: Cloudtype이 자동 처리
- **월 비용: $5~10 (7~14k원)**

### 시나리오 C — 점차 확장

- 시작: Oracle Free → 트래픽 증가 시 VPS $6 → 더 늘면 Railway/Render

## OAuth callback URL 정책 (백로그 B-1 연결)

- 운영 환경 URL이 결정되면 `compute_base_url` 로직 갱신 또는 `OAUTH_BASE_URL` env 추가 필요
- Kakao/Google/Naver Developers 콘솔에 운영 도메인 redirect_uri 등록 필요

## 배포 시 체크리스트

| 항목 | 조치 |
|:--|:--|
| Alembic 첫 마이그레이션 생성 | `cd backend && alembic revision --autogenerate -m "initial"` |
| `.env` 운영용 작성 (secrets 강력 키) | `JWT_SECRET_KEY = openssl rand -hex 32` |
| ADMIN_EMAILS 점주 이메일 입력 | 운영 시작 시 |
| OAuth 키 셋업 (사용자 직접) | 별도 |
| HTTPS 강제 (cookie secure=True 자동) | 도메인 https 사용 시 자동 |
| 백업 정책 결정 | Postgres dump 일 1회 권장 |
| 로그 수집 | stdlib logging → 파일 또는 외부 (Sentry 무료 티어 검토) |
| 다중 워커 도입 시 Redis | B-6 — 워커 1개 유지면 불필요 |

## PM 추천

**시나리오 A (Oracle Cloud Free ARM, Seoul)**.

- 영구 무료 + 한국 리전 + 24GB RAM이면 트래픽 증가 여유 큼
- 운영 부담 = nginx/Caddy 설정 + 도메인 연결 + cron 백업 정도. 가이드 풍부
- 향후 트래픽이 폭증해도 같은 VM에서 워커 다중화 가능 (Redis 도입은 그때)

> 단점 보완: Oracle Free Tier는 가끔 "장기 미사용 종료" 정책 변경 사례가 있어 모니터링 필요. 백업을 다른 곳에 (S3·Backblaze 무료) 주기적 보관 권장.

대안: **시나리오 B (Cloudtype Lite $5)** — 운영 부담을 더 줄이고 싶고 월 5천~1만원 OK면 가장 간편.
