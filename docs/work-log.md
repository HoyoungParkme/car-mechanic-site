# 작업 로그

## Sprint 1: FastAPI 마이그레이션 + 도메인 아키텍처

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-11 | [분석 시작] | 유저 요청: "Replit로 만든 자동차 정비소 웹사이트 초안의 백엔드를 FastAPI로 변경, 도메인 아키텍처 적용" |
| 2026-05-11 | [PM 직접] | 프로젝트 구조 파악: monorepo(pnpm). 백엔드는 TS Express(src/) + 부분 마이그레이션된 FastAPI(python/) 공존. 프론트 = auto-shop(React+Vite). DB는 lib/db(Drizzle). FastAPI 도메인 후보: auth, reservations, photos, expertise, shop_info, storage |
| 2026-05-11 | [위임→researcher] | 프로젝트 전체 현황 조사: 1) TS Express와 FastAPI 코드의 기능 매핑/차이 2) DB 스키마(Drizzle vs SQLAlchemy) 차이 3) 프론트가 호출하는 API 목록과 어디서 호출하는지 4) 인증 흐름 5) 외부 의존(카카오 알림 등) |
| 2026-05-11 | [완료←researcher] | 결과: FastAPI가 실제 운영 백엔드, 6도메인 28엔드포인트 구현됨. TS Express는 healthz뿐. Drizzle/api-spec 사실상 미사용. Admin 3개 탭(사진/기술/매장정보)·storage UI 미연결. SMS OTP·카카오 알림톡·OAuth는 코드만 있고 실제 연동 안 됨. → docs/agents/researcher/01_project-survey.md |
| 2026-05-11 | [PM 직접] | 명확화 질문 3개 추려 유저에게 보고 (스프린트 범위/도메인 아키텍처 깊이/구식 코드 정리 정책) |
| 2026-05-11 | [유저 응답] | Q3 → 구식 잔재 폐기. Q2 → 예시 보고 결정. Q1 → 미응답. 추가 요청: 권한 프롬프트 자주 뜨는 것 자동 수락 등록 |
| 2026-05-11 | [PM 직접] | fewer-permission-prompts 스킬 호출 — 세션 transcript 스캔 후 read-only 도구 allowlist를 .claude/settings.json에 등록 |
| 2026-05-11 | [PM 직접] | docs/design/architecture-example.md 작성 (도메인 아키텍처 예시 — 3레이어/2레이어 비교, reservations·shop_info 코드 샘플) |
| 2026-05-11 | [유저 응답] | "진행해줘. 우선 무료로 해보고 싶어." → PM 판단으로 위임, 유료 외부 서비스 보류 |
| 2026-05-11 | [판단] | Q1=A+B(백엔드 리팩토링 + Admin 미연결 탭 연결), Q2=혼합(추천), 외부 연동(SMS·카카오·GCS)은 무료 대안으로 처리 |
| 2026-05-11 | [분석→설계] | 분석 완료, 설계 단계 시작 |
| 2026-05-11 | [PM 직접] | docs/design/tech-decisions.md 작성 (기술 결정) + docs/pm/02 작성 (판단 로그) |
| 2026-05-11 | [유저 응답] | 스토리지=로컬, Postgres=로컬 Docker 확정 |
| 2026-05-11 | [PM 직접] | docs/design/data-model.md, api-spec.md 작성, 스프린트 분해 |
| 2026-05-11 | [위임→design-reviewer] | 설계 문서(tech-decisions, data-model, api-spec, architecture-example) 교차 검증 + 다이어그램 생성 |
| 2026-05-11 | [완료←design-reviewer] | 결론: "일부 수정 후 진행 권장". 즉시처리 2건(관리자 시드 방법, async/sync 불일치), 누락 결정 3건(로깅, exception handler, refresh token), 코드↔설계 불일치는 Sprint 1에 포함. 리포트: docs/agents/design-reviewer/01_sprint1-review.md, 다이어그램 5개: docs/design/diagrams/ |
| 2026-05-11 | [PM 직접] | 보완 결정 6개 (관리자 시드 스크립트, async 통일, stdlib logging, 전역 exception handler, refresh 미사용 명시, password/username 기준 설계대로) → docs/pm/04 작성, tech-decisions 보완 |
| 2026-05-11 | [설계→구현] | 설계 완료, 사용자 "진행" 응답. Sprint 1 작업 1 시작 |
| 2026-05-11 | [PM 직접] | 작업 1: 구식 잔재 폐기 (TS Express, lib/*) + 환경 셋업 (.env.example, .gitignore, docker-compose.yml) |
| 2026-05-11 | [PM 직접] | 작업 2: core/ 7개 파일(config,database,security,deps,logging,errors,__init__) + main.py 재작성 + Alembic 환경(alembic.ini, migrations/env.py, script.py.mako) + requirements.txt(alembic, pydantic-settings 추가, gcs 제거) + database.py·auth.py를 shim으로 변환 |
| 2026-05-11 | [유저 요청] | 구조 재정의: Replit 인프라 폐기 + backend/frontend 평탄 분리 + models(복수) 통일. 자세히는 docs/pm/05 |
| 2026-05-11 | [판단] | 큰 변경이지만 작업 1·2 결과물은 보존됨(폴더만 이동). 새 작업 분해: 재-1(이주+폐기), 재-2(도메인), 재-3(보안), 재-4(storage), 재-5(검증) |
| 2026-05-11 | [PM 직접] | 작업 재-1 완료: Replit 인프라(.replit, .replitignore, replit.md, .local, .agents, attached_assets, mockup-sandbox, .replit-artifact×2) + monorepo(pnpm-workspace.yaml, pnpm-lock, 루트 package.json, tsconfig×2, .npmrc, scripts/) 모두 폐기. python→backend, auto-shop→frontend 이동. frontend의 Replit Vite 플러그인·catalog 의존성 정리, tsconfig standalone화. 루트 .gitignore에 Python 항목 추가 |
| 2026-05-11 | [PM 직접] | 작업 재-2/3/4 통합 완료: database.py 루트로(core/database 폐기), 6도메인 분해(auth/reservations/photos/expertise/shop_info/storage 각 router·service·crud·models·schemas, auth만 utils), main.py 갱신(라우터 6개 조립 + /uploads StaticFiles + expose_headers X-Dev-OTP), migrations/env.py 모델 import 갱신, scripts/seed_admin.py 신규. 보안 정리(dev_otp 헤더화, username≥4·password≥8). storage는 LocalStorageCRUD(async) + S3/GCS 교체용 Protocol. 잔재 폐기(auth.py shim, models.py, schemas.py, routers/) |
| 2026-05-12 | [유저 요청 1] | "전화번호 회원가입 하지 말자. PASS 인증도 돈 엄청 나갈 것 같아" |
| 2026-05-12 | [PM 직접] | 영향 범위 조사: auth 도메인의 phone OTP/로컬 가입 코드와 frontend Login.tsx의 phone UI 식별 |
| 2026-05-12 | [유저 요청 2] | "카톡/구글/네이버 로그인 살리고 회원/비회원예약 분리. 유료 운영 비용 어느정도?" |
| 2026-05-12 | [PM 직접] | 비용 시나리오 추산 (시나리오 A 0~1.5k, B 7k~1만, B+ 1.5~2만, C 5~7만원). OAuth 무료, PASS는 가입비 50~100만+건당 200~300원. 영향 분석 보고 |
| 2026-05-12 | [PM 명확화] | Q1 관리자 OAuth 통합 여부, Q2 비회원 예약 폼, Q3 비회원 조회/취소 |
| 2026-05-12 | [유저 응답] | Q1 → 관리자도 OAuth. Q2 → 회원과 동일 폼. Q3 → B(전화번호+예약번호 조회/취소) |
| 2026-05-12 | [판단] | Sprint 1에 작업 재-4.5(OAuth-only 개편) 편입. 비회원 예약은 Sprint 2 분리. 관리자 식별=이메일 화이트리스트(매 로그인 시 set) |
| 2026-05-12 | [PM 직접] | REQ-02(OAuth-only) + REQ-03(비회원 예약 백로그) + PM-06(개편 결정) 작성. requirements.md/pm index/sprint.md 갱신 |
| 2026-05-12 | [PM 직접] | 설계 문서 갱신: tech-decisions(인증 정책·security·env), data-model(User 컬럼 정리, phone_otps 삭제), api-spec(로컬 auth 엔드포인트 폐기 명시), diagrams/auth-flow(OAuth 흐름 전면 재작성) + diagrams/erd(슬림화) |
| 2026-05-12 | [PM 직접] | 작업 재-4.5 구현 완료: core/config.py(admin_emails list 파싱), core/security.py(hash/verify 삭제), requirements.txt(passlib 제거), .env.example(ADMIN_EMAILS), main.py(expose_headers 제거), domains/auth/(models·schemas·crud·service·router·utils·__init__ 전면 갱신), migrations/env.py(PhoneOTP import 제거), scripts/seed_admin.py 삭제. frontend/pages/Login.tsx OAuth-only 단순 페이지로 재작성 |
| 2026-05-12 | [위임→reviewer] | Sprint 1 최종 리뷰 (backend 전체 + Login.tsx). 중점: OAuth-only 일관성, 화이트리스트 매칭, OAuth 콜백 안전성, 도메인 의존성 방향. 결과 → docs/agents/reviewer/01_sprint1-final-review.md |
| 2026-05-12 | [위임→test-writer] | Sprint 1 백엔드 테스트 작성 + 실행. 우선순위: auth(화이트리스트·JWT·/me) > reservations(충돌·권한) > storage(검증). 결과 → docs/agents/test-writer/01_sprint1-tests.md + backend/tests/ |
| 2026-05-12 | [완료←reviewer] | 결과: "수정 권장". 치명적 1건(C-1 httpx 네트워크 예외 미처리), 주의 3건(W-1 Naver state 미검증, W-2 localhost 포트 하드코딩, W-3 utcnow deprecated), 개선 6건(잔재 docstring·input-otp·anyio·Literal·email 등). 리포트: docs/agents/reviewer/01_sprint1-final-review.md |
| 2026-05-12 | [완료←test-writer] | 결과: 58/58 통과. 작성 6개 파일(conftest + core/security + auth/service·router + reservations/service + storage/crud). 발견: ①reservations/schemas.py `date` 필드명이 `datetime.date` 타입을 shadowing → test-writer가 직접 수정 ②`ReservationService.create()`에 date+time_slot 충돌 검사 미구현 (api-spec.md 409 명세와 불일치) ③requirements.txt에 pytest/pytest-asyncio/anyio[trio] 추가. 리포트: docs/agents/test-writer/01_sprint1-tests.md |
| 2026-05-12 | [PM 판단] | 즉시 수정 3건(C-1, W-1, 충돌검사) + 즉시 정리 3건(S-1, S-2, S-3) + 운영 노트. W-2/W-3/S-4~6는 백로그 |
| 2026-05-12 | [PM 직접] | C-1: OAuth fetch 3개에 try/except httpx.HTTPError + warning 로깅. W-1: `_NAVER_STATE` 상수 + 콜백 state 검증. 충돌 검사: `find_by_slot`(status != rejected) + `create`에서 409 raise. S-1/S-2: core/scripts docstring 정리. S-3: input-otp.tsx 삭제 + package.json 의존성 제거. 운영 노트: .env.example에 Kakao 이메일 동의 안내 |
| 2026-05-12 | [PM 직접] | pytest 재실행 58/58 통과 (회귀 없음) |
| 2026-05-12 | [Sprint 1 완료] | 완료 기준 모두 달성. 후속 백로그 5건 sprint.md에 정리. 상세: docs/pm/07_sprint1-completion.md |

## Sprint 2: 비회원 예약 + 통합 폼 (REQ-03)

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-12 | [분석 시작] | 유저: "Sprint 2 진행해줘. 너의 판단으로 다 만든 다음 보고하면 피드백" |
| 2026-05-12 | [판단] | Q1=B(lookup_code 6자리), Q2=B(rate limit), Q3=A(폼 입력값 우선), B-4(status Literal) 동반 처리 |
| 2026-05-12 | [PM 직접] | PM-08 작성, requirements/03 상태 갱신, sprint.md Sprint 2로 전환 |
| 2026-05-12 | [분석→설계] | 설계 문서 갱신 시작 |
| 2026-05-12 | [PM 직접] | 설계 문서 갱신: tech-decisions §15 추가, data-model Reservation 변경, api-spec 3개 엔드포인트 추가, diagrams/guest-reservation-flow 신규 |
| 2026-05-12 | [PM 직접] | core/rate_limit.py 신규 (in-memory IP 카운터 + get_client_ip) |
| 2026-05-12 | [PM 직접] | reservations 도메인 확장: models(컬럼 추가), schemas(customer_*, lookup_code, Literal status), utils 신규(normalize_phone, generate_lookup_code), crud(find_by_lookup, lookup_code_exists, outerjoin user), service(create user=Optional, lookup_by_phone_code, cancel_by_lookup), router(Optional Auth POST, GET/DELETE /lookup with rate limit) |
| 2026-05-12 | [PM 직접] | 프론트엔드: Reservation.tsx 회원/비회원 통합 폼 + lookup_code 결과 화면, ReservationLookup.tsx 신규, App.tsx /reservation/lookup 라우트, Admin.tsx customer_name 표시 + 비회원 뱃지 |
| 2026-05-12 | [PM 직접] | pytest 실행: 46/58 통과(reservations 12개 회귀 — 새 스키마 미반영). test-writer 위임으로 갱신 예정 |
| 2026-05-12 | [위임→reviewer] | Sprint 2 변경 부분 리뷰. 결과 → docs/agents/reviewer/02_sprint2-review.md |
| 2026-05-12 | [위임→test-writer] | reservations 테스트 갱신 + 신규(비회원 흐름, rate_limit, utils). 결과 → docs/agents/test-writer/02_sprint2-tests.md |
| 2026-05-12 | [완료←reviewer] | 결과: "조건부 배포 가능". Critical 0. W-1(rate_limit race), W-2(메모리 누수), W-3(Admin 에러 미처리), W-4(utcnow 반복). S-1(_LOOKUP_CHARS 주석 31자 vs 30자), S-2~6. 리포트: docs/agents/reviewer/02_sprint2-review.md |
| 2026-05-12 | [완료←test-writer] | 결과: 113/113 통과. 기존 회귀 12개 수정 + test_service 23개 신규(비회원 생성/lookup/cancel/멱등/rate_limit/422) + test_utils 신규(normalize_phone·generate_lookup_code 16개) + test_rate_limit 신규(16개). 부수 발견: utils 주석 30자 vs 실제 31자 |
| 2026-05-19 | [세션 재개] | 사용자 "OAuth 외 전체 진행". A(Sprint 2 마무리) + B(Sprint 3) + C(Sprint 4) + D(Sprint 5) 4단계 분해. OAuth 실키·카카오 알림톡·실제 배포는 외부 의존으로 제외 |
| 2026-05-19 | [PM 직접] | A 단계 처리: W-2 cleanup, W-4 utcnow→utc_now (core/clock 신규 + 6파일), S-1 주석 31자 정정, W-3 Admin 에러 alert, B-3 anyio 명시, B-5 pydantic[email]→pydantic |
| 2026-05-19 | [판단] | W-1 rate_limit race는 atomic 메서드 신설하지 않음. 라우터 흐름상 영향 미미, 다중 워커는 B-6 Redis로 본질 해결. PM-09에 기록 |
| 2026-05-19 | [PM 직접] | pytest 회귀 발생: admin_emails 7건 — config의 admin_emails가 property가 되어 monkeypatch 실패. 테스트 패턴을 admin_emails_raw로 갱신. 결과: 118/118 통과 |
| 2026-05-19 | [Sprint 2 완료] | 완료 기준 + Warning 모두 달성. 상세: docs/pm/09_sprint2-completion.md |

## Sprint 3: Admin 미연결 + 공개 페이지 API 연동 (REQ — Sprint 1 분석에서 식별)

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [분석 시작] | Admin 3개 탭이 DEMO state. Home/Reservation의 PHOTOS/SERVICES/매장정보 하드코드. 백엔드 API는 모두 구현됨 |
| 2026-05-19 | [판단] | 범위 확장 — Admin만이 아니라 공개 페이지의 하드코딩도 같은 API로 연동. 그래야 운영 도구가 의미 있음. PM-10 작성 |
| 2026-05-19 | [PM 직접] | `frontend/src/lib/{icon-map, shop-info}.ts` 신규. Admin 3개 탭(Photos/Expertise/ShopInfo) useQuery+useMutation으로 재작성. PhotosTab은 multipart 업로드→URL→photo 등록 흐름. ExpertiseTab은 icon_name 자유 입력. ShopInfoTab은 bulk PUT |
| 2026-05-19 | [PM 직접] | Home.tsx PHOTOS/SERVICES 하드코드 제거, useQuery로 교체. Reservation.tsx + Layout.tsx 매장 정보 useShopInfo로 교체 |
| 2026-05-19 | [PM 직접] | framer-motion Variants 타입 명시 (잠재 타입 에러 정리). frontend typecheck 통과. backend pytest 118/118 통과 (회귀 없음) |
| 2026-05-19 | [위임→reviewer] | Sprint 3 변경 부분 리뷰. 결과 → docs/agents/reviewer/03_sprint3-review.md |
| 2026-05-19 | [완료←reviewer] | "배포 가능". Critical 0 / Warning 4 / Suggestion 6 |
| 2026-05-19 | [PM 직접] | Warning 4건 + Suggestion 일부 처리: W-1 useRef 플래그, W-2 PhotoService.delete async + storage 파일 삭제, W-3 saveError state, W-4 lib/queries.ts queryFn 통일, S-1 datalist, S-2 useShopInfo 재사용 |
| 2026-05-19 | [위임→test-writer] | photos delete 테스트 + storage 파일 삭제 검증 |
| 2026-05-19 | [완료←test-writer] | 9개 신규 + 122/122 통과 |
| 2026-05-19 | [Sprint 3 완료] | 완료 기준 달성. 상세: docs/pm/11_sprint3-completion.md |

## Sprint 4: 백로그 정리 (B-7/B-8/S-6)

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [분석/결정] | PM-12: B-7 IP 5분/5회 rate limit, B-8 User.phone 추가 안 하고 최신 예약 자동채움, S-6 expertise.title 사용 |
| 2026-05-19 | [PM 직접] | core/rate_limit.reservation_create_rate_limit 신규, POST /api/reservations에 check+record. Reservation.tsx에 autofilled useRef + serviceOptions(expertise.title) |
| 2026-05-19 | [PM 직접] | conftest._reset_rate_limits autouse fixture로 lookup/create 두 인스턴스 격리 |
| 2026-05-19 | [위임→reviewer+test-writer] | Sprint 4 변경 부분 |
| 2026-05-19 | [완료←reviewer] | "조건부 배포 가능". W-1~3, S-1~4 |
| 2026-05-19 | [완료←test-writer] | B-7 rate limit 4건 신규. 126/126 통과 |
| 2026-05-19 | [PM 직접] | W-1 docstring 보강, W-2 isError 분기, W-3 로컬 fixture 제거, S-1 중복 title Set 제거, S-3 router docstring. 백엔드 136 통과 |
| 2026-05-19 | [Sprint 4 완료] | 완료 기준 달성. 상세: docs/pm/13_sprint4-completion.md |

## Sprint 5: 배포 환경 분석

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [PM 직접] | docs/design/deploy-options.md 작성 (Oracle Free / Cloudtype / Render / Railway / Fly.io / VPS 6개 비교). 시나리오 A/B/C 권장안 |
| 2026-05-19 | [추천] | 시나리오 A — Oracle Cloud Free ARM (Seoul, 24GB RAM, 영구 무료) + 도메인 1.5만원/년 |
| 2026-05-19 | [Sprint 5 완료 (분석만)] | 실제 배포는 사용자 호스팅 선택 + OAuth 콘솔 + 도메인 결정 후 별도 스프린트 |

## Sprint 6: 운영 준비 잔여 정리

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [PM 판단] | 사용자 "잔여도 계속 작업". B-1/Alembic/S-2/S-4/onError 처리, B-6 보류 |
| 2026-05-19 | [PM 직접] | B-1: oauth_base_url config 추가, compute_base_url 2인자, 라우터 7곳 갱신, .env.example |
| 2026-05-19 | [PM 직접] | Alembic: alembic.ini 한글 주석→영문, timezone=UTC 제거 (Windows tzdata 회피). SQLite 임시로 autogenerate → migrations/versions/2a9d4566b2a7_initial_schema.py 생성 |
| 2026-05-19 | [PM 직접] | S-2 queryKey `["reservations","mine"]`, S-4 autofilled 주석, useShopInfo onError console.error |
| 2026-05-19 | [PM 직접] | 백엔드 136 통과, 프론트 typecheck 통과 |
| 2026-05-19 | [Sprint 6 완료] | 완료 기준 달성. 상세: docs/pm/15_sprint6-backlog-cleanup.md |

## Sprint 7: 정적 사이트로 방향 전환 (시나리오 X)

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [유저 요청] | "로그인, 백엔드로 예약관리 이런거 다 지워줘. 무조건 번호로만 예약할거야" |
| 2026-05-19 | [PM 명확화] | 시나리오 X/Y/Z 제안 |
| 2026-05-19 | [유저 응답] | "X로 하자" — 가장 단순 (백엔드 전체 폐기 + 정적 사이트) |
| 2026-05-19 | [판단] | Sprint 1~6 결과물 대부분 폐기. 호스팅도 Oracle ARM → 정적 CDN(Cloudflare Pages 등)으로 재검토 |
| 2026-05-19 | [PM 직접] | PM-16 + REQ-04 작성. requirements 01~03 상태 "❌ 폐기"로 변경. sprint.md Sprint 7로 전환 |
| 2026-05-19 | [PM 직접] | `frontend/src/data/shop.ts` 신규 (정적 데이터 단일 출처). Home/Layout/Reservation 재작성. App.tsx 라우트 축소(`/`, `/reservation`, 404) |
| 2026-05-19 | [PM 직접] | 파일 삭제: pages/Login·Admin·ReservationLookup, hooks/useAuth, lib/queries·shop-info·icon-map |
| 2026-05-19 | [PM 직접] | `backend/` 전체 + `docker-compose.yml` 삭제. vite.config.ts proxy 제거. `@tanstack/react-query` 의존성 제거 |
| 2026-05-19 | [검증] | typecheck 통과 + `npm run build` 성공 (JS 433KB gzip 140KB) |
| 2026-05-19 | [Sprint 7 완료] | 정적 사이트 전환 완료. 호스팅 결정 대기. 상세: docs/pm/17_sprint7-completion.md |
