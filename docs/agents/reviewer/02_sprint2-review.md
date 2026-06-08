# Reviewer-02: Sprint 2 변경 부분 리뷰 (비회원 예약)

- 위임일: 2026-05-12
- 완료일: 2026-05-12
- 스프린트: 2

## 종합 판단

**조건부 배포 가능** (Critical 0 / Warning 4 / Suggestion 6)

## 리뷰 대상

- `backend/domains/reservations/` (models, schemas, crud, service, router, utils)
- `backend/core/rate_limit.py`
- `frontend/src/pages/Reservation.tsx`, `ReservationLookup.tsx`
- `frontend/src/pages/Admin.tsx` (변경 부분)
- `frontend/src/App.tsx`

## 잘 작성된 부분

- Optional Auth POST 흐름 정확: `user is None`일 때 `user_id=NULL` 저장 OK
- `normalize_phone` 저장·조회 일관성 유지
- `cancel_by_lookup` 멱등성 정상 (이미 rejected면 no-op + 200)
- `lookup_code` 충돌 회피 5회 재시도 + `secrets.choice` 사용 적절
- `ReservationLookup.tsx`의 200/404/429 분기 처리 적절

## Warning

### W-1. `rate_limit.check()`와 `record_failure()` 별도 Lock 트랜잭션

- 파일: `backend/core/rate_limit.py`
- 문제: `check()` 후 `record_failure()` 호출 사이에 다른 스레드가 같은 IP로 실패 누적 시 임계치를 초과한 채 통과 가능
- 조치: 라우터에서 `check`→`record_failure`를 단일 atomic 메서드로 통합 또는 `check_and_record()` 신설 고려

### W-2. `record_failure()`에서 `_cleanup()` 미호출 → 장기 누수

- 파일: `backend/core/rate_limit.py:54-56`
- 문제: 차단 후 다시 접속 없는 IP의 타임스탬프가 계속 메모리에 남음
- 조치: `record_failure` 안에서도 `_cleanup(ip)` 호출 또는 주기적 cleanup task

### W-3. `Admin.tsx` updateReservation 에러 미처리

- 파일: `frontend/src/pages/Admin.tsx:544` 부근
- 문제: PUT 응답 4xx/5xx에 대한 사용자 피드백 없음. status Literal 위반 등 422가 와도 무음 실패
- 조치: response.ok 체크 + toast/error 표시 추가

### W-4. `datetime.utcnow()` deprecated 반복

- 파일: `backend/domains/reservations/models.py:30`
- 문제: Sprint 1 W-3(백로그 B-2)에 이어 새 모델에도 반복
- 조치: B-2 처리 시 함께 교체

## Suggestion

### S-1. `_LOOKUP_CHARS` 주석 vs 실제 길이 불일치
- `utils.py:11` 주석은 "30자" 풀이라 표기하나 실제 문자열 길이 31자. 보안 영향은 미미하나 주석 정확성

### S-2. `lookup_code_exists` SELECT id만 가져오기는 OK이나 `LIMIT 1` 명시화 권장

### S-3. `Reservation.user_id` ondelete=SET NULL 정책의 운영 의미 문서화 필요 (회원 탈퇴 시 customer_* 그대로 보존)

### S-4. `ReservationLookup.tsx`의 `code` 정규화는 클라이언트만 — 서버도 `code.strip().upper()` 처리 중이라 OK이나 `phone` 정규화는 서버에서만 (클라이언트는 raw). 일관성 측면에서 클라이언트도 phone 하이픈 제거 후 전송 권장

### S-5. `Admin.tsx`의 `Reservation` 인터페이스가 router 응답과 sync 유지 필요 — 향후 자동 타입 생성 검토 (openapi-typescript)

### S-6. `core/rate_limit.py`에 unit test 작성 후 동작 의도 명확화 (test-writer가 후속으로 작성)

## 도메인 아키텍처 평가

- 의존성 방향 유지
- `rate_limit`을 라우터에서 직접 호출하는 패턴 OK — 단, atomic 보장 W-1 참고
- `utils.py`의 normalize/generate 헬퍼가 domain-local로 잘 위치

## 보안 평가

- `lookup_code`: 31^6 ≈ 8.8억 조합. `secrets.choice` 사용 — 안전
- rate limit: 5분 10회 임계치 적절. 단 W-1, W-2 보완 필요
- IDOR: 비회원 lookup이 `phone + code` 둘 다 매칭하므로 보호됨
- Optional Auth: 비로그인이어도 데이터 입력만으로 예약 가능 — spam 위험 (백로그 B-7)
