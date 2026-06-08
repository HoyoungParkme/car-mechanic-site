# 요청 처리 흐름 — POST /api/reservations (3레이어 예시)

한 요청이 router → service → repository를 거쳐 응답까지 처리되는 흐름.

```mermaid
sequenceDiagram
    actor U as 사용자
    participant C as 클라이언트
    participant RO as reservations/router.py
    participant DEP as core/deps.py
    participant SE as reservations/service.py
    participant RE as reservations/repository.py
    participant DB as PostgreSQL

    U->>C: 예약 등록 폼 제출
    C->>RO: POST /api/reservations\nBody: {date, time_slot, service_type, ...}\nCookie: access_token

    Note over RO,DEP: 인증 의존성 실행 (Depends)

    RO->>DEP: get_current_user(access_token)
    DEP->>DEP: decode_access_token(token)
    DEP->>DB: SELECT users WHERE id=?
    DB-->>DEP: User 객체
    DEP-->>RO: user (User)

    Note over RO,SE: Pydantic 검증 통과 후 service 호출

    RO->>SE: service.create(user, payload: ReservationCreate)

    Note over SE,RE: 비즈니스 규칙 검사

    SE->>RE: repo.exists_in_slot(date, time_slot)
    RE->>DB: SELECT reservations\nWHERE date=? AND time_slot=?\nLIMIT 1
    DB-->>RE: 결과

    alt 해당 시간대 이미 예약 있음
        RE-->>SE: True
        SE-->>RO: HTTPException 409
        RO-->>C: 409 {"detail": "해당 시간대는 이미 예약되어 있습니다."}
        C-->>U: 오류 메시지 표시
    else 시간대 비어있음
        RE-->>SE: False
        SE->>SE: Reservation 객체 생성\n(status="pending")
        SE->>RE: repo.save(reservation)
        RE->>DB: INSERT reservations
        DB-->>RE: Reservation 객체 (id 포함)
        RE-->>SE: Reservation
        SE-->>RO: Reservation
        RO->>RO: Pydantic 직렬화\nReservationOut
        RO-->>C: 201 Created\nBody: ReservationOut
        C-->>U: "예약이 등록되었습니다"
    end
```

레이어 책임 요약:
- `router.py`: HTTP 파싱, 인증 의존성(`Depends`), 응답 직렬화. `HTTPException`은 여기서만 발생
- `service.py`: 비즈니스 규칙(시간대 충돌 검사, 권한 검사). SQLAlchemy 세션 직접 접근 없음
- `repository.py`: SQLAlchemy 세션을 통한 DB 조회/저장. 비즈니스 로직 없음
