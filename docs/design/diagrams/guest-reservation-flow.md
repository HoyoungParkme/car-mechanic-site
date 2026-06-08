# 비회원 예약 + 조회/취소 흐름 (Sprint 2 / REQ-03)

회원/비회원이 동일한 폼으로 예약하고, 비회원은 전화번호+예약번호로 본인 예약을 조회·취소.

## 1단계 — 예약 생성 (회원/비회원 통합)

```mermaid
sequenceDiagram
    actor U as 사용자<br/>(회원 or 비회원)
    participant C as 클라이언트<br/>(Reservation.tsx)
    participant R as reservations/router.py
    participant S as reservations/service.py
    participant DB as PostgreSQL

    U->>C: 폼 입력 (이름, 전화, 차량, 날짜, 시간, 메모)
    alt 로그인 회원
        C->>C: 본인 이름 자동 채움 (수정 가능)
    end
    C->>R: POST /api/reservations (Optional Auth)
    Note over R: 로그인 쿠키 있으면 user_id 자동 연결,<br/>없으면 user_id=NULL
    R->>S: create(user_or_none, ReservationCreate)
    S->>DB: SELECT WHERE date=? AND time_slot=? AND status != 'rejected'
    alt 충돌
        S-->>R: 409
        R-->>C: "해당 시간에 이미 예약이 있습니다"
    else
        S->>S: lookup_code 생성 (secrets.choice, 6자리, 충돌 시 재시도)
        S->>DB: INSERT reservations (user_id?, customer_name, customer_phone,<br/>date, time_slot, lookup_code, status='pending', ...)
        DB-->>S: Reservation
        S-->>R: ReservationCreatedOut(id, lookup_code, ...)
        R-->>C: 201
        C->>U: 예약번호 안내 화면 (lookup_code 표시)
    end
```

## 2단계 — 비회원 조회

```mermaid
sequenceDiagram
    actor U as 비회원
    participant C as 클라이언트<br/>(ReservationLookup.tsx)
    participant L as core/rate_limit.py
    participant R as reservations/router.py
    participant S as reservations/service.py
    participant DB as PostgreSQL

    U->>C: 전화번호 + 예약번호 입력
    C->>R: GET /api/reservations/lookup?phone=&code=
    R->>L: check(client_ip)
    alt 5분 내 10회 실패 누적
        L-->>R: 차단
        R-->>C: 429 "잠시 후 다시 시도해주세요"
    else
        R->>S: lookup(phone, code)
        S->>DB: SELECT WHERE customer_phone=? AND lookup_code=?
        alt 매칭 실패
            S->>L: record_failure(client_ip)
            S-->>R: 404
            R-->>C: 404 "예약을 찾을 수 없습니다"
        else
            S->>L: reset(client_ip)
            S-->>R: Reservation
            R-->>C: 200 ReservationOut
            C->>U: 예약 정보 표시 + 취소 버튼
        end
    end
```

## 3단계 — 비회원 취소 (soft delete)

```mermaid
sequenceDiagram
    actor U as 비회원
    participant C as 클라이언트
    participant R as reservations/router.py
    participant S as reservations/service.py
    participant DB as PostgreSQL

    U->>C: 취소 버튼 클릭 (확인 모달)
    C->>R: DELETE /api/reservations/lookup?phone=&code=
    R->>R: rate limit 체크 (조회와 동일 로직)
    R->>S: cancel_by_lookup(phone, code)
    S->>DB: SELECT WHERE customer_phone=? AND lookup_code=?
    alt 매칭 실패
        S-->>R: 404
        R-->>C: 404
    else
        S->>S: status='rejected', rejection_reason='고객 취소' set
        S->>DB: UPDATE reservations
        DB-->>S: ok
        S-->>R: ok
        R-->>C: 200 {"cancelled": true}
        C->>U: "예약이 취소되었습니다"
    end
```

## 데이터 정합성 정책 (PM-08)

| 케이스 | customer_name | customer_phone | user_id |
|:--|:--|:--|:--|
| 비회원 예약 | 폼 입력 | 폼 입력 | NULL |
| 회원 예약 (본인 정보로) | 폼 입력 (User.name 자동 채움) | 폼 입력 (수동 입력) | user.id |
| 회원 예약 (대리) | 폼 입력 (가족 이름) | 폼 입력 (가족 번호) | user.id |

회원이 폼에서 임의 수정해도 User 테이블 정보는 변경되지 않는다.

## 보안 정책

- `lookup_code`는 `secrets.choice` 사용. 헷갈리는 0/O/1/I/L 제외 (대문자 알파벳 + 숫자 약 30자 풀)
- IP 기반 rate limit은 lookup 조회/취소 두 엔드포인트에 공통 적용
- 비회원 취소는 soft delete (status='rejected') — 운영자가 이력 확인 가능
- FK ondelete=SET NULL — 회원 탈퇴 시에도 운영 이력 보존
