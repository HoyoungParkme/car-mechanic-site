# 현재 작업

## 04: Sprint 4 변경 부분 리뷰

- 위임일: 2026-05-19
- 스프린트: 4
- 상태: 진행 중

### 컨텍스트 (PM-12)

- **B-7**: `POST /api/reservations`에 IP rate limit (5분/5회). `core/rate_limit.reservation_create_rate_limit` 신규 싱글톤. 회원/비회원 공통
- **B-8**: 회원 로그인 시 Reservation 폼 자동 채움 — 본인 최신 예약(`GET /api/reservations` 첫 번째)의 customer_name/customer_phone. 예약 이력 없으면 User.name만
- **S-6**: Reservation `serviceOptions` = expertise.title + "기타". expertise 빈 응답이면 FALLBACK_SERVICES
- 테스트 격리: `conftest._reset_rate_limits` autouse fixture로 lookup/create 두 인스턴스 카운터 클리어

### 리뷰 범위

- `backend/core/rate_limit.py` (싱글톤 추가)
- `backend/domains/reservations/router.py` (create_reservation에 rate limit 적용)
- `backend/tests/conftest.py` (autouse fixture 추가)
- `frontend/src/pages/Reservation.tsx` (자동 채움 + serviceOptions)

### 중점

1. B-7 패턴: `check + record_failure`를 매번 호출 — 성공·실패 무관 카운트가 맞는지
2. autofilled useRef 플래그 동작 (myReservations가 도착하지 않은 상태에서 user만 있을 때)
3. enabled: !!user 조건이 비로그인에서는 fetch 안 함
4. serviceOptions 빈 fallback 분기
5. autouse fixture가 다른 테스트에 부작용 없는지

### 결과

`docs/agents/reviewer/04_sprint4-review.md` (01~03 형식)

# 완료된 작업

| # | 내용 | 날짜 | 결과 |
|:--|:--|:--|:--|
| 01 | Sprint 1 최종 리뷰 | 2026-05-12 | 수정 권장 |
| 02 | Sprint 2 리뷰 | 2026-05-12 | 조건부 배포 가능 |
| 03 | Sprint 3 리뷰 | 2026-05-19 | 배포 가능 |
| 04 | Sprint 4 리뷰 (백로그 정리) | 2026-05-19 | 조건부 배포 가능. Critical 0, W-1~3, S-1~4 |
