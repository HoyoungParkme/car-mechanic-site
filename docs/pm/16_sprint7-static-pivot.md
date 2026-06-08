# PM-16: Sprint 7 — 정적 사이트로 방향 전환 (큰 결정)

- 스프린트: 7
- 날짜: 2026-05-19

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [유저 요청] | "로그인, 백엔드로 예약관리 다 지워줘. 무조건 번호로만 예약할거야" |
| 2026-05-19 | [PM 명확화] | 시나리오 X/Y/Z 제안 (X=가장 단순, Y=중간, Z=작은 변경) |
| 2026-05-19 | [유저 응답] | "X로 하자" |
| 2026-05-19 | [판단] | 시나리오 X 확정. 백엔드 전체 폐기 + 프론트 정적 사이트화. 점주는 손님 전화로만 예약 받음 |

## 핵심 결정 (시나리오 X)

| 영역 | 결정 |
|:--|:--|
| **예약 방식** | 손님이 사이트의 전화번호로 직접 전화 (사이트엔 예약 폼 없음) |
| **로그인** | OAuth 전체 폐기. 회원 개념 자체 없음 |
| **백엔드** | `backend/` 폴더 전체 삭제. FastAPI, Postgres, docker-compose, Alembic 모두 폐기 |
| **데이터** | 매장정보·서비스·사진을 `frontend/src/data/shop.ts` 정적 파일로 보관. 점주가 직접 코드 수정 또는 향후 CMS 도입 시 재논의 |
| **프론트** | 정적 사이트. Home + Reservation(전화 안내) + 푸터. 다른 페이지 삭제 |
| **인프라** | 호스팅은 정적 호스팅 (GitHub Pages / Cloudflare Pages / Vercel / Netlify — 모두 무료) |
| **비용** | 도메인비만 (연 1.5만원). 그 외 0원 |

## 폐기되는 자산 (Sprint 1~6 결과물)

### 백엔드 (100% 폐기)
- `backend/` 전체 디렉토리
- FastAPI 도메인 6개 (auth, reservations, photos, expertise, shop_info, storage)
- Postgres + Alembic + docker-compose.yml
- 136개 pytest, 18개 design 문서 일부

### 프론트엔드 (페이지/유틸 삭제)
- `pages/Login.tsx`
- `pages/Admin.tsx`
- `pages/ReservationLookup.tsx`
- `pages/Reservation.tsx` → "전화 예약 안내"로 축소
- `hooks/useAuth.ts`
- `lib/queries.ts`, `lib/shop-info.ts`, `lib/icon-map.ts` (또는 단순화)

### 인프라
- `.env`, `.env.example` (frontend는 별도)
- `docker-compose.yml`
- Vite proxy 설정

### 보존되는 자산
- `frontend/src/components/ui/*` (shadcn 컴포넌트)
- `frontend/src/components/Layout.tsx` (정적 데이터로 갱신)
- `frontend/src/pages/Home.tsx` (정적 데이터로 갱신)
- `frontend/src/pages/not-found.tsx`
- Vite + Tailwind + React 기본 환경

## Sprint 1~6 문서는 어떻게?

- 기록 유지 (히스토리). `docs/pm/01~15`, `docs/design/*`, `docs/agents/*` 그대로 보존
- `docs/requirements/01~03`는 상태를 **"폐기 (Sprint 7 정적 사이트 전환)"**로 표시
- 새 요구사항 REQ-04 "정적 사이트 전환" 작성

## 판단 기록

### [결정] 사진·서비스 카테고리·매장정보 정적 파일로

- 결정: `frontend/src/data/shop.ts`에 모든 정적 데이터 통합. 점주는 깃 푸시 또는 별도 도구로 수정
- 이유: 운영 비용 0원 정책. CMS 도입은 점주 요청 시 별도 결정
- 대안: Strapi/Sanity 같은 무료 헤드리스 CMS — 도입 비용·관리 부담 vs 가치 낮음

### [결정] 호스팅은 정적 호스팅으로

- 결정: Sprint 5의 Oracle Free ARM 권장은 백엔드 필요할 때만 의미. 정적이면 Cloudflare Pages / Vercel / Netlify가 더 간편 + 빠름
- 이유: 정적 자산 CDN 배포가 훨씬 단순. SSL 자동, 도메인 연결 한 줄
- Sprint 5 분석 문서(`deploy-options.md`)는 "백엔드 필요한 경우" 참고용으로 보존

### [결정] 카카오 알림톡·OAuth 키 셋업 모두 무관해짐

- 시나리오 X에서는 외부 API 호출 자체가 없음
- 알림톡: 점주가 전화 받으면 됨
- OAuth: 회원이 없음

## Sprint 7 작업 분해

1. PM-16 작성 (이 파일) + sprint.md/requirements.md 갱신
2. `frontend/src/data/shop.ts` 신규 — 모든 정적 데이터 통합
3. 프론트 페이지 재작성: Home, Layout, Reservation, App.tsx
4. 불필요한 파일 삭제: pages/Login, Admin, ReservationLookup, hooks/useAuth, lib/queries, lib/shop-info (또는 lib/icon-map)
5. 백엔드 폴더 삭제, docker-compose.yml 삭제
6. vite.config.ts proxy 제거
7. package.json 의존성 정리 (react-query 등)
8. typecheck 통과

## 리스크

| 리스크 | 영향 | 완화 |
|:--|:--|:--|
| 이전 작업 자산 폐기 | 작업 시간 손실 | 문서·코드는 깃 히스토리에 남음. 필요 시 복원 가능 |
| 향후 "예약 관리 다시 필요해" 요청 시 처음부터 다시 | 가능성 있음 | Sprint 1~6 코드는 git log에서 부활 가능 |
| 점주가 직접 데이터 수정해야 함 | 비기술 운영자에게 부담 | 정적 데이터 파일 1개에 집중. 향후 CMS 도입 가능 |

## 완료 기준

- 백엔드 폴더 삭제 확인
- 프론트 typecheck 통과
- Home에서 정적 데이터로 사진/서비스/매장정보 표시
- 전화번호 클릭 시 tel: 링크 동작
- `npm run build`로 정적 자산 생성 가능
