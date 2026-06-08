# PM-17: Sprint 7 완료 (정적 사이트 전환)

- 스프린트: 7
- 날짜: 2026-05-19

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [PM 직접] | `frontend/src/data/shop.ts` 신규 — 매장/서비스/사진/통계/후기 정적 데이터 단일 출처 |
| 2026-05-19 | [PM 직접] | `Home.tsx` 재작성 — useQuery 제거, SHOP/SERVICES/PHOTOS/STATS/REVIEWS 정적 import |
| 2026-05-19 | [PM 직접] | `Reservation.tsx` 재작성 — 폼 제거, 큰 전화 버튼(`tel:` 링크) + 영업시간 안내 |
| 2026-05-19 | [PM 직접] | `Layout.tsx` 재작성 — useAuth/드롭다운 제거, 푸터 정적 데이터 |
| 2026-05-19 | [PM 직접] | `App.tsx` 라우트 축소 — `/`, `/reservation`, NotFound만 |
| 2026-05-19 | [PM 직접] | 파일 삭제: `pages/Login.tsx`, `pages/Admin.tsx`, `pages/ReservationLookup.tsx`, `hooks/useAuth.ts`, `lib/queries.ts`, `lib/shop-info.ts`, `lib/icon-map.ts` |
| 2026-05-19 | [PM 직접] | `backend/` 디렉토리 전체 삭제. `docker-compose.yml` 삭제. `vite.config.ts` proxy 제거 |
| 2026-05-19 | [PM 직접] | `@tanstack/react-query` 의존성 제거 (사용처 없음) |
| 2026-05-19 | [검증] | typecheck 통과 + `npm run build` 성공 (433 KB JS / 100 KB CSS, gzip 후 140 KB / 16 KB) |
| 2026-05-19 | [Sprint 7 완료] | 완료 기준 모두 달성 |

## 검증 결과

| 항목 | 결과 |
|:--|:--|
| 백엔드 디렉토리 삭제 | ✅ |
| docker-compose 삭제 | ✅ |
| 프론트 타입 체크 | ✅ |
| 프론트 빌드 (`npm run build`) | ✅ `dist/public/` 생성 |
| 정적 자산 크기 | JS 433 KB (gzip 140 KB), CSS 100 KB (gzip 16 KB) — CDN에 충분히 가벼움 |
| 전화 링크 동작 | `<a href="tel:010-3090-6998">` (Home Hero, CTA, Reservation, Layout 푸터) |

## 폐기 자산 (Sprint 1~6 결과물)

### 삭제됨
- `backend/` (FastAPI 6 도메인 + Postgres + Alembic + tests/ 136개 + scripts/)
- `frontend/src/pages/{Login,Admin,ReservationLookup}.tsx`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/lib/{queries,shop-info,icon-map}.ts`
- `docker-compose.yml`
- frontend `@tanstack/react-query` 패키지

### 보존됨 (히스토리)
- `docs/pm/01~15.md` — 진행 기록
- `docs/agents/` — agent 결과
- `docs/design/*.md` — 설계 문서 (백엔드 폐기로 무효지만 참고용)
- `docs/requirements/01~03.md` — 상태 "❌ 폐기"로 표시
- `frontend/src/components/ui/*` — shadcn 컴포넌트 (정적 사이트에서도 유용)

## Sprint 7 완료 기준 체크

| 기준 | 결과 |
|:--|:--|
| `backend/` 전체 삭제 | ✅ |
| `docker-compose.yml` 삭제 | ✅ |
| `frontend/src/data/shop.ts` 신규 | ✅ |
| Home 정적 데이터 기반 | ✅ |
| Layout 정적 데이터 기반 | ✅ |
| Reservation 전화 안내 페이지 | ✅ |
| Login/Admin/Lookup 폐기 | ✅ |
| App.tsx 라우트 축소 | ✅ |
| Vite proxy 제거 | ✅ |
| package.json 정리 | ✅ |
| `npm run typecheck` 통과 | ✅ |
| `npm run build` 성공 | ✅ |

## 다음 단계 (사용자 결정)

| 항목 | 결정 필요 |
|:--|:--|
| **정적 호스팅 선택** | Cloudflare Pages / Vercel / Netlify / GitHub Pages — 모두 무료. 추천: Cloudflare Pages (한국 CDN 빠름) |
| **도메인 등록** | 가비아 또는 Cloudflare Registrar (~1.5만원/년) |
| **DNS 연결** | 호스팅 사이트의 가이드대로 |
| **정적 데이터 수정 방법** | 점주가 직접 `frontend/src/data/shop.ts` 편집 후 git push → 자동 재배포 |

## 운영 시 추천 워크플로우

```
1. 점주가 사진/서비스/매장정보를 변경하고 싶을 때
   → frontend/src/data/shop.ts 편집
   → git commit && git push
   → Cloudflare Pages가 자동으로 빌드 + 배포 (1~2분)

2. 새 사진 추가
   → 이미지를 Cloudflare R2 / Imgur / Cloudinary 무료 업로드
   → URL을 shop.ts의 PHOTOS 배열에 추가
   → push
```

이로써 운영 비용은 **도메인비(연 1.5만원) 외 0원**.
