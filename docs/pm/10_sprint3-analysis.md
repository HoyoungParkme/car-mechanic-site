# PM-10: Sprint 3 분석 + 결정 (Admin 미연결 탭 + 공개 페이지 API 연동)

- 스프린트: 3
- 날짜: 2026-05-19

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [분석 시작] | 유저: Sprint 3 진행 (Admin 미연결 탭 + storage UI) |
| 2026-05-19 | [PM 직접] | 영향 범위 조사: Admin.tsx PhotosTab/ExpertiseTab/ShopInfoTab 3개 모두 DEMO state. Home.tsx PHOTOS/SERVICES 하드코드. Reservation.tsx 매장 정보 하드코드. 백엔드 API는 모두 구현됨 |

## 핵심 결정

### [결정 1] 범위 확장 — Admin 탭 + 공개 페이지 모두 API 연동

- 결정: Admin 3개 탭만이 아니라, Home.tsx의 PHOTOS/SERVICES, Reservation.tsx의 매장 정보까지 같은 API로 연결
- 이유: Admin에서 데이터를 수정해도 공개 페이지가 하드코딩되어 있으면 무의미. 관리 시스템의 핵심 가치는 "실제 노출되는 데이터를 점주가 직접 관리"
- 대안: Admin만 연결 → Sprint 3 성과가 visible하지 않음. Sprint 4로 미루면 빈 운영 도구만 만들고 끝남

### [결정 2] expertise = 홈의 "서비스" 카테고리로 통합

- 결정: Home.tsx의 SERVICES(8개 하드코드) 섹션을 expertise API로 교체. Admin > 기술 탭에서 icon_name 입력 추가
- icon_name: lucide-react 아이콘 이름(`"Wrench"`, `"Battery"` 등) 자유 입력. 매핑 헬퍼 `frontend/src/lib/icon-map.ts` 신규. 인식 못 하는 이름은 `Wrench` fallback
- 이유: 두 데이터가 사실상 같은 의미(정비 서비스 종류). 한 곳에서 관리해야 정합성 유지

### [결정 3] shop-info 키 표준화

- 결정: 사용 키 = `address`, `phone`, `weekday_hours`, `saturday_hours`, `directions` (Admin 탭이 이미 사용 중인 키 그대로)
- 프론트 페이지(`Home`, `Reservation`, `Layout` 푸터)는 useQuery로 받아서 노출
- 빈 응답일 때는 fallback 안내 텍스트 표시

### [결정 4] 사진 업로드 흐름

- 결정: 2단계 흐름 (multipart 업로드 → URL 응답 → photo 등록)
  1. `POST /api/storage/upload` (multipart) → `{ url }`
  2. `POST /api/photos` `{ url, caption, sort_order }`
- 이유: 백엔드 명세 그대로 (storage와 photos가 분리된 도메인)
- UI: PhotosTab에 "파일 선택 + 캡션" 폼. 업로드 진행 표시. 성공 시 invalidate

### [결정 5] react-query 사용 패턴

- 모든 fetch를 useQuery/useMutation으로 통일
- 캐시 키: `["photos"]`, `["expertise"]`, `["shop-info"]`
- 수정 시 `queryClient.invalidateQueries({ queryKey: [...] })`

## 작업 분해

| # | 작업 | 파일 |
|:--|:--|:--|
| 1 | icon 매핑 헬퍼 + shop-info 키 헬퍼 | `frontend/src/lib/icon-map.ts`, `lib/shop-info.ts` |
| 2 | PhotosTab: useQuery + 파일 업로드 multipart + 등록/삭제 | `pages/Admin.tsx` |
| 3 | ExpertiseTab: useQuery + CRUD + icon_name 입력 | `pages/Admin.tsx` |
| 4 | ShopInfoTab: useQuery + bulk PUT | `pages/Admin.tsx` |
| 5 | Home.tsx: PHOTOS/SERVICES → API | `pages/Home.tsx` |
| 6 | Reservation.tsx: 매장 정보 → API | `pages/Reservation.tsx` |
| 7 | Layout.tsx: 푸터 매장 정보 → API (선택) | `components/Layout.tsx` |
| 8 | 검증 (reviewer + test-writer) | agent 위임 |

## 리스크

| 리스크 | 영향 | 완화 |
|:--|:--|:--|
| photos/expertise 빈 응답 시 공개 페이지가 빈 섹션 | UX 저하 | fallback 메시지("아직 등록된 사진이 없습니다") |
| icon_name이 lucide-react에 없으면 깨짐 | 시각 깨짐 | Wrench 아이콘 기본값 |
| Admin이 비회원 예약 등 새 필드 영향 (Sprint 2에서 이미 처리) | 없음 | — |
| 백엔드 테스트 영향 | 없음 (스키마 변경 없음) | — |

## 다음 단계

설계는 거의 변경 없음 (API 그대로). 구현 후 reviewer + test-writer 위임.
