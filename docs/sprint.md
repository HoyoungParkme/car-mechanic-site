# 현재 스프린트

## 스프린트 정보

- 스프린트 번호: 7
- 목표: **정적 사이트로 방향 전환** (REQ-04, 시나리오 X). 백엔드 전체 폐기 + 프론트 정적 데이터 기반
- 상태: ✅ 완료 — 호스팅 결정 대기

## 현재 단계

- [x] 분석 (PM-16, REQ-04)
- [x] 설계 (PoC — 정적 파일 단일 출처)
- [x] 구현
- [x] 검증 (typecheck + build 성공)

## 이번 스프린트 완료 기준

- `backend/` 폴더 전체 삭제
- `docker-compose.yml` 삭제
- `frontend/src/data/shop.ts` 신규 — 매장정보·서비스·사진 정적 데이터 단일 출처
- `Home.tsx` 정적 데이터 기반으로 동작 (useQuery 제거)
- `Layout.tsx` 정적 데이터 기반 (useShopInfo 제거)
- `Reservation.tsx` → "전화 예약 안내" 페이지로 축소 (폼 없음)
- 폐기: `Login.tsx`, `Admin.tsx`, `ReservationLookup.tsx`, `hooks/useAuth.ts`, `lib/queries.ts`, `lib/shop-info.ts`, `lib/icon-map.ts`(또는 정적 인라인화)
- `App.tsx` 라우트 정리 (홈 + 예약 안내 + not-found만)
- `vite.config.ts` proxy 제거
- `package.json` 정리 (`@tanstack/react-query` 등 제거 가능)
- `npm run typecheck` 통과
- `npm run build` 정적 자산 생성 성공

상세: `docs/pm/16_sprint7-static-pivot.md`, `docs/requirements/04_static-site-pivot.md`

## 중간 추가 요청 (파킹랏)

| # | 요청 내용 | 긴급도 | 처리 |
|:--|:--|:--|:--|
| - | - | - | - |

## 백로그 (Sprint 7 이후)

| # | 내용 | 트리거 |
|:--|:--|:--|
| 정적 호스팅 셋업 | Cloudflare Pages / Vercel / Netlify 선택 | 사용자 결정 |
| 도메인 등록 + DNS | 가비아/Cloudflare | 사용자 결정 |
| 향후 CMS 도입 검토 | 점주가 직접 데이터 수정 부담 시 | 운영 시작 후 |

## 스프린트 히스토리

| 스프린트 | 목표 | 완료 여부 | 완료일 | 비고 |
|:--|:--|:--|:--|:--|
| 1 | 백엔드 도메인 아키텍처 + 구식 잔재 폐기 + OAuth-only | ❌ 폐기 (Sprint 7) | 2026-05-12 | 코드 삭제. 히스토리 보존 |
| 2 | 비회원 예약 + 통합 폼 + 비회원 조회/취소 | ❌ 폐기 (Sprint 7) | 2026-05-19 | 코드 삭제 |
| 3 | Admin 미연결 탭 + 공개 페이지 API 연동 | ❌ 폐기 (Sprint 7) | 2026-05-19 | 코드 삭제 |
| 4 | 백로그 정리 (rate limit/자동채움/서비스 옵션) | ❌ 폐기 (Sprint 7) | 2026-05-19 | 코드 삭제 |
| 5 | 배포 환경 분석 | (부분 보존) | 2026-05-19 | 정적 호스팅으로 재검토 |
| 6 | 운영 준비 잔여 정리 | ❌ 폐기 (Sprint 7) | 2026-05-19 | 코드 삭제 |
| 7 | **정적 사이트로 방향 전환 (시나리오 X)** | ✅ 완료 | 2026-05-19 | backend 전체 삭제, frontend 정적 데이터, build 성공 |
