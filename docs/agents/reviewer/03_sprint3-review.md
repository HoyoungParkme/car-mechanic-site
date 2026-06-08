# Reviewer-03: Sprint 3 변경 부분 리뷰 (Admin + 공개 페이지 API 연동)

- 위임일: 2026-05-19
- 완료일: 2026-05-19
- 스프린트: 3

## 종합 판단

**배포 가능** (Critical 0 / Warning 4 / Suggestion 6). 핵심 설계(캐시 공유, whitelist 기반 아이콘 보안, fallback)가 올바르게 구현됨.

## 리뷰 대상

- `frontend/src/lib/{icon-map, shop-info}.ts` (신규)
- `frontend/src/pages/Admin.tsx` (Photos/Expertise/ShopInfo Tab + 인터페이스)
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/Reservation.tsx` (useShopInfo 부분)
- `frontend/src/components/Layout.tsx` (푸터)

## 잘 작성된 부분

- icon-map whitelist로 XSS 차단 — `dangerouslySetInnerHTML`/`eval` 미사용, 미등록 이름은 `Wrench` fallback
- 캐시 키 `["photos"]`/`["expertise"]`/`["shop-info"]` 일관 + invalidate 누락 없음
- shop-info fallback 설계 — DB 빈 값/서버 오류에도 공개 페이지 의미 있는 정보 노출
- 사진 업로드 2단계 에러 격리 — 1단계 실패 시 throw로 2단계 진행 차단
- framer-motion `Variants` 타입 명시
- Layout이 매 페이지에서 useShopInfo 호출해도 staleTime 60s로 네트워크 1회

## Warning (배포 전 검토 권장)

### W-1. ShopInfoTab `useEffect` 의존성 — draft 의존성 부적절

- 파일: `Admin.tsx:885-891`
- 문제: `useEffect`가 `[items, draft]` 의존성. draft 변경 → useEffect 재실행 → 조건 검사 → 리턴 반복. "최초 1회" 의도는 useRef 플래그가 적절
- 조치: `useRef<boolean>` 플래그로 초기화 여부 관리

### W-2. 사진 삭제 시 storage 파일 고아(orphan) — 디스크 누수

- 파일: `Admin.tsx:706-714` / `backend/domains/photos/service.py`
- 문제: `DELETE /api/photos/{id}`가 DB 레코드만 삭제. `LocalStorageCRUD.delete(url)`이 있는데 호출 안 됨
- 위험: `/uploads/` 디렉터리에 물리 파일 무한 누적
- 조치: `PhotoService.delete`에서 storage.delete(photo.url) 호출 추가

### W-3. ExpertiseTab 에러 처리 일관성 — `window.alert` 의존

- 파일: `Admin.tsx:787-817`
- 문제: Photos/ShopInfo는 `error` state로 UI 표시, Expertise만 `window.alert` 사용
- 조치: 동일한 `useState<string | null>` 패턴으로 통일

### W-4. photos/expertise queryFn 에러 처리 불일치

- 파일: `Admin.tsx:660-665` vs `Home.tsx:33-39`
- 문제: 같은 queryKey인데 Admin은 throw, Home은 return []. 마운트 순서·staleTime에 따라 어느 queryFn이 실행될지 비결정적
- 조치: 같은 queryKey는 같은 queryFn 사용. `lib/`로 추출하거나 throw로 통일하고 Home에서 isError 분기

## Suggestion

- S-1: `AVAILABLE_ICON_NAMES` 미사용 — ExpertiseTab의 자유 입력을 datalist/select로 연결
- S-2: ShopInfoTab이 useShopInfo 재사용하지 않고 useQuery 직접 호출
- S-3: useShopInfo 에러 시 `return []`로 isError 숨김 — 모니터링 관점 단점
- S-4: Admin의 useQuery에 staleTime 없음 (Home은 60s)
- S-5: ExpertiseTab `save()` 에러 메시지에 서버 detail 미포함
- S-6: `Reservation.tsx`의 `SERVICES = [...]` 하드코딩 여전 — expertise API와 연결할지 비즈니스 결정 필요

## 보안 평가

- icon-map whitelist 안전 ✅
- 업로드: 확장자/크기 검증 (Sprint 1 검증 통과) — 추가 위험 없음
- W-2 디스크 누수가 실서비스에서 운영 리스크

## 체크리스트

| 항목 | 결과 |
|:--|:--|
| 네이밍 | OK |
| 함수 설계 | W-1 |
| 에러 처리 | W-3, W-4, S-3, S-5 |
| 보안 | OK (W-2는 디스크) |
| 구조 | W-4, S-2 |
| 타입 | OK |
| 성능 | OK |
| 서비스 일관성 | S-6 |
