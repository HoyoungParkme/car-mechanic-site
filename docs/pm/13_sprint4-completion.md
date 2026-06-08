# PM-13: Sprint 4 완료 (백로그 정리)

- 스프린트: 4
- 날짜: 2026-05-19

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-19 | [완료←reviewer] | "조건부 배포 가능". Critical 0 / W-1 rate 카운트 의미 / W-2 useQuery 에러 분기 / W-3 fixture 중복. S-1~4 |
| 2026-05-19 | [완료←test-writer] | B-7 rate limit 4건 신규. 126/126 통과 |
| 2026-05-19 | [PM 직접] | W-1: docstring 보강(의도 명시). W-2: isError 분기 추가. W-3: 로컬 fixture 제거. S-1: serviceOptions Set 중복 제거. S-3: router 모듈 docstring B-7 추가. S-2/S-4 백로그 |
| 2026-05-19 | [PM 직접] | 백엔드 136/136 통과, 프론트 typecheck 통과 |
| 2026-05-19 | [Sprint 4 완료] | 완료 기준 달성 |

## 처리 결과

| 항목 | 처리 |
|:--|:--|
| B-7 비회원 예약 spam 차단 | `reservation_create_rate_limit` 싱글톤 (5분/5회), POST 라우터에 check+record 적용. conftest autouse fixture로 격리 |
| B-8 회원 폼 자동 채움 | `myReservations` queryFn + autofilled useRef. 최신 예약의 customer_name/phone 자동 채움, 예약 이력 없으면 User.name |
| S-6 SERVICES → expertise | `serviceOptions` = expertise.title (중복 제거) + "기타". 빈/에러 시 FALLBACK_SERVICES |
| W-1 rate limit 의도 | router docstring에 "5번째 성공 후 6번째부터 차단" 명시 |
| W-2 useQuery 에러 fallback | `isError` 분기로 명시 |
| W-3 fixture 중복 | `test_service.py`의 로컬 `clear_rate_limit` 제거. conftest 전역 담당 |
| S-1 중복 title 방어 | `new Set(...)`로 제거 |
| S-3 router docstring | Sprint 4 섹션 추가 |

## 백로그 잔여

- S-2: myReservations queryKey 통일 (현재 부작용 없음)
- S-4: autofilled useRef 주석
- S-3 useShopInfo 에러 핸들링 (Sprint 3 백로그)
- B-1 운영 redirect_uri (Sprint 5에서)
- B-6 Redis 도입 (배포 후)
- Alembic 첫 마이그레이션 생성 (배포 시)

## 완료 기준 체크

| 기준 | 결과 |
|:--|:--|
| B-7 POST rate limit 5분/5회 | ✅ |
| B-8 폼 자동 채움 (이름+전화) | ✅ |
| S-6 expertise 기반 service options | ✅ |
| reviewer 검증 (Critical 0) | ✅ |
| test-writer 126→136 통과 | ✅ |
