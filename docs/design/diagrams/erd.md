# ERD — 전체 테이블 관계도

Sprint 1 데이터 모델 (PM-06 OAuth-only 개편 반영). `users` 1:N `reservations`, 그 외 테이블은 독립 엔티티.

```mermaid
erDiagram
    users ||--o{ reservations : "예약한다"

    users {
        int id PK
        string oauth_provider "google/kakao/naver"
        string oauth_id
        string email "nullable, 관리자 화이트리스트 키"
        string name
        text profile_image "nullable"
        boolean is_admin "default false, ADMIN_EMAILS 매칭 시 자동 set"
        datetime created_at
    }

    reservations {
        int id PK
        int user_id FK
        date date "INDEX (date,time_slot)"
        string time_slot "예: 10:00"
        string service_type
        string vehicle_model "nullable"
        string vehicle_number "nullable"
        text notes "nullable"
        string status "pending/confirmed/rejected/completed"
        text rejection_reason "nullable"
        boolean is_completed "default false"
        boolean is_paid "default false"
        boolean kakao_notified "default false"
        datetime created_at
    }

    photos {
        int id PK
        text url
        string caption "nullable"
        int sort_order "default 0"
        datetime created_at
    }

    expertise_items {
        int id PK
        string title
        text description "nullable"
        string icon_name "nullable, lucide"
        int sort_order "default 0"
        datetime created_at
    }

    shop_info {
        int id PK
        string key "UNIQUE"
        text value "nullable"
    }
```

주요 인덱스 (Sprint 1 신규 추가):
- `ix_reservations_date_time` ON reservations(date, time_slot) — 시간대 충돌 체크 + 캘린더 조회
- `ix_reservations_user_date` ON reservations(user_id, date DESC) — 사용자별 예약 목록 조회
