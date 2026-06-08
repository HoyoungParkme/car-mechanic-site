# 예약 상태 전이 다이어그램

`reservations.status` 컬럼의 허용 전이. service 레이어에서 강제한다.

```mermaid
stateDiagram-v2
    [*] --> pending : POST /api/reservations\n(사용자 예약 등록)

    pending --> confirmed : PUT /api/reservations/{id}\n관리자 확정
    pending --> rejected : PUT /api/reservations/{id}\n관리자 거절 (rejection_reason 입력)

    confirmed --> completed : PUT /api/reservations/{id}\nis_completed=true 설정

    completed --> [*]
    rejected --> [*]

    note right of pending
        초기 상태
        is_completed=false
        is_paid=false
    end note

    note right of confirmed
        관리자 확정
        카카오 알림톡 발송 가능
        (kakao_notified 토글)
    end note

    note right of completed
        작업 완료 + 결제 완료
        is_completed=true
        is_paid=true (별도 설정)
    end note
```

상태 전이 규칙 (service에서 검증):
- `pending` → `confirmed` / `rejected`: 관리자만 가능
- `confirmed` → `completed`: 관리자만 가능
- 역방향 전이(예: `confirmed` → `pending`)는 허용하지 않는다
- `status`는 현재 `String(20)` 타입. ENUM 전환은 파킹랏 D-4 (다음 스프린트)
