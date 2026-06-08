# PM-11: Sprint 3 완료 (Admin + 공개 페이지 API 연동)

- 스프린트: 3
- 날짜: 2026-05-19

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [완료←reviewer] | "배포 가능". Critical 0. Warning 4건 (W-1 useEffect 의존성, W-2 사진 삭제 시 파일 고아, W-3 Expertise 에러 처리 일관성, W-4 queryFn 불일치). Suggestion 6건 |
| 2026-05-19 | [완료←test-writer] | photos delete 테스트 9개 신규. 122/122 통과 |
| 2026-05-19 | [PM 판단] | Warning 4건 + Suggestion 일부(S-2, S-1 datalist) 처리. S-6(Reservation SERVICES expertise 연결)은 Sprint 4로 |
| 2026-05-19 | [PM 직접] | W-2 백엔드: PhotoService.delete async + storage.delete 호출. W-1: ShopInfoTab useRef 플래그. W-3: Expertise saveError state. W-4: lib/queries.ts 신규로 queryFn 통일. S-1: datalist로 icon 자동완성. S-2: ShopInfoTab이 useShopInfo 재사용 |
| 2026-05-19 | [PM 직접] | TypeScript 타입체크 + 백엔드 회귀 모두 통과 (frontend tsc OK, backend 122 passed) |
| 2026-05-19 | [Sprint 3 완료] | 완료 기준 달성. 시연은 사용자 직접 |

## 처리 결과

| # | 항목 | 처리 |
|:--|:--|:--|
| W-1 | ShopInfoTab useEffect 의존성 | `useRef<boolean>` 플래그로 최초 1회 초기화 보장 + `useShopInfo` 재사용 |
| W-2 | 사진 삭제 시 storage 파일 고아 | `PhotoService.delete` async + `storage.delete(url)` 호출 (URL이 `/uploads/`로 시작할 때만). 실패해도 DB 삭제는 진행 |
| W-3 | Expertise 에러 처리 일관성 | `saveError` state로 통일. 서버 detail 메시지 포함 |
| W-4 | photos/expertise queryFn 불일치 | `frontend/src/lib/queries.ts` 신규 (fetchPhotos/fetchExpertise). Admin/Home 모두 동일 함수 |
| S-1 | datalist 미연결 | `<datalist id="icon-names">`로 자동완성 제공 |
| S-2 | ShopInfoTab useShopInfo 미재사용 | useShopInfo 재사용으로 통일 |

## 백로그로 미룬 항목

- S-3 useShopInfo 에러 시 빈 배열 (모니터링 관점) — 운영 모니터링 정책과 함께 결정
- S-4 Admin staleTime 없음 — Sprint 3에서 staleTime 60s 추가했음 (이미 처리)
- S-5 ExpertiseTab save() 메시지 서버 detail — W-3 처리 시 포함됨 (이미 처리)
- **S-6 Reservation.tsx SERVICES 하드코딩** — Sprint 4로 (expertise 카테고리 + 액션 분리 필요)

## Sprint 3 완료 기준 체크

| 기준 | 결과 |
|:--|:--|
| Admin Photos 탭 API 연동 + 업로드 multipart | ✅ |
| Admin Expertise 탭 CRUD + icon_name | ✅ |
| Admin ShopInfo 탭 bulk PUT | ✅ |
| Home 공개 페이지 데이터 API 반영 | ✅ |
| Reservation/Layout 매장 정보 API 반영 | ✅ |
| 사진 삭제 시 파일 정리 (W-2) | ✅ |
| reviewer "배포 가능" | ✅ |
| test-writer 통과 | ✅ (118 → 122) |

## 다음 단계

Sprint 4 — 백로그 정리 (B-7 비회원 예약 spam 차단, B-8 회원 phone 자동채움, S-6 예약 서비스 선택지 expertise 연동)
