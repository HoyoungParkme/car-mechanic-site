# Reviewer-04: Sprint 4 변경 부분 리뷰 (백로그 정리: B-7/B-8/S-6)

- 위임일: 2026-05-19
- 완료일: 2026-05-19
- 스프린트: 4

## 종합 판단

**조건부 배포 가능** (Critical 0 / Warning 3 / Suggestion 4). W-1은 명세 확인, W-2·W-3은 즉시 처리 권장.

## 잘 작성된 부분

- create rate limit를 lookup과 별개 싱글톤으로 분리 (정책 분리)
- autofilled useRef 패턴 + `myReservations !== undefined` 분기 정확
- conftest autouse fixture로 두 rate limit 인스턴스 클리어

## Warning

### W-1. create rate limit 5회 카운트 의미

- 파일: `domains/reservations/router.py:56-57`
- 문제: `check + record_failure` 매번 호출 → 5번째 성공 후 6번째부터 차단. lookup 패턴(실패 시만 record)과 다름
- 조치: PM 명세("5분/5회 = 성공 포함")와 일치. docstring 보강만

### W-2. useQuery 에러 시 FALLBACK 모호

- 파일: `Reservation.tsx:51-58`
- 문제: `expertise = []` 기본값은 data가 undefined일 때만. queryFn throw 시 fallback이 우연 동작
- 조치: `isError` 분기 명시

### W-3. test_service의 clear_rate_limit fixture가 conftest와 중복

- 파일: `tests/domains/reservations/test_service.py:25-30`
- 조치: 로컬 fixture 제거 (conftest의 autouse가 전역 담당)

## Suggestion

- S-1: serviceOptions 중복 title 방어 (`new Set`) — 처리
- S-2: myReservations queryKey 통일 — 백로그 (현재 부작용 없음)
- S-3: create_reservation router 모듈 docstring에 B-7 추가 — 처리
- S-4: autofilled useRef 주석 — 백로그

## 체크리스트

| 항목 | 결과 |
|:--|:--|
| 네이밍 | OK |
| 함수 설계 | OK |
| 에러 처리 | W-2 |
| 보안 | OK |
| 구조 | W-3 |
| Rate limit 의미 | W-1 |
| 데이터 중복 방어 | S-1 |
