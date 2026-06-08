# 데이터 모델 (Sprint 1)

## 전략

- **기존 SQLAlchemy 모델을 도메인 폴더로 분리** (`backend/domains/<name>/models.py`).
- **Alembic 초기 마이그레이션 1개**로 OAuth-only 스키마를 캡처.
- **추가 인덱스만 신규**: 예약 조회 성능 + 충돌 체크 빈도 고려.
- **PM-06 개편**: `User.username`/`password_hash`/`phone` 컬럼 제거, `phone_otps` 테이블 완전 삭제.

## ERD (텍스트)

```
┌─────────────────┐         ┌──────────────────┐
│      users      │ 1     N │   reservations   │
│  id (PK)        │─────────│ user_id (FK)     │
│  oauth_provider │         │ id (PK)          │
│  oauth_id       │         │ date             │
│  email          │         │ time_slot        │
│  name           │         │ service_type     │
│  profile_image  │         │ vehicle_*        │
│  is_admin       │         │ status           │
│  created_at     │         │ is_completed     │
└─────────────────┘         │ is_paid          │
                            │ kakao_notified   │
                            │ created_at       │
                            └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│      photos      │    │ expertise_items  │
│  id (PK)         │    │  id (PK)         │
│  url             │    │  title           │
│  caption         │    │  description     │
│  sort_order      │    │  icon_name       │
│  created_at      │    │  sort_order      │
└──────────────────┘    │  created_at      │
                        └──────────────────┘

┌─────────────────┐
│    shop_info    │
│  id (PK)        │
│  key (UNQ)      │
│  value          │
└─────────────────┘
```

> PM-06 변경: `phone_otps` 테이블 삭제, `users.username`/`password_hash`/`phone` 컬럼 삭제.

## 테이블 명세

### users — 인증·회원 (PM-06 슬림화)

| 컬럼 | 타입 | 제약 | 설명 |
|:--|:--|:--|:--|
| id | Integer | PK | 사용자 ID |
| oauth_provider | String(20) | NOT NULL | `google` / `kakao` / `naver` |
| oauth_id | String(255) | NOT NULL | OAuth 제공자별 식별자 |
| email | String(255) | nullable | 이메일 (provider 응답, 관리자 화이트리스트 매칭 키) |
| name | String(255) | NOT NULL | 표시명 |
| profile_image | Text | nullable | 프로필 이미지 URL |
| is_admin | Boolean | default=False | 관리자 권한 (`ADMIN_EMAILS` 매칭 시 자동 set) |
| created_at | DateTime | default=utcnow | 생성 시각 |

**인덱스**:
- `(oauth_provider, oauth_id)` 복합 lookup용 — Alembic autogenerate에서 unique 제약 검토

> PM-06 삭제 컬럼: `username`, `password_hash`, `phone`

### ~~phone_otps~~ — **테이블 삭제** (PM-06)

### reservations — 예약 (Sprint 2 확장)

| 컬럼 | 타입 | 제약 | 설명 |
|:--|:--|:--|:--|
| id | Integer | PK | |
| user_id | Integer | FK users.id (SET NULL), **nullable** | 비회원 예약은 NULL |
| customer_name | String(100) | **NOT NULL** | 폼 입력 이름 (회원이어도 폼 값 우선) |
| customer_phone | String(20) | **NOT NULL, INDEX** | 폼 입력 전화번호 (조회 키) |
| lookup_code | String(6) | **NOT NULL, UNIQUE INDEX** | 영숫자 6자리 (Sprint 2) |
| date | Date | NOT NULL | 예약 날짜 |
| time_slot | String(10) | NOT NULL | 시간대 (예: "10:00") |
| service_type | String(100) | NOT NULL | 서비스 종류 |
| vehicle_model | String(100) | nullable | |
| vehicle_number | String(50) | nullable | |
| notes | Text | nullable | |
| status | String(20) | default="pending" | `pending` / `confirmed` / `rejected` / `completed` |
| rejection_reason | Text | nullable | 거절 사유 |
| is_completed | Boolean | default=False | 작업 완료 플래그 |
| is_paid | Boolean | default=False | 결제 완료 플래그 |
| kakao_notified | Boolean | default=False | 알림톡 발송 플래그 (현재 미연동) |
| created_at | DateTime | default=utcnow | |

**인덱스**:
- `ix_reservations_date_time` ON (date, time_slot) — 시간대 충돌 체크
- `ix_reservations_user_date` ON (user_id, date DESC) — 사용자별 예약 조회
- `ix_reservations_phone` ON (customer_phone) — **신규** 비회원 조회용
- `ux_reservations_lookup_code` UNIQUE ON (lookup_code) — **신규** 예약번호 유일성

**FK 변경 (Sprint 2)**: `user_id ondelete=CASCADE → SET NULL` (회원 탈퇴 시에도 운영 이력 보존)

**상태 전이 (도메인 규칙, service에서 강제)**:
```
pending ──confirmed──> confirmed ──completed──> completed
   │                       │
   └──rejected──> rejected ┘
```

### photos — 갤러리 사진

| 컬럼 | 타입 | 제약 | 설명 |
|:--|:--|:--|:--|
| id | Integer | PK | |
| url | Text | NOT NULL | 이미지 URL (로컬 저장 시 `/uploads/{uuid}.{ext}`) |
| caption | String(255) | nullable | 캡션 |
| sort_order | Integer | default=0 | 정렬 순서 |
| created_at | DateTime | default=utcnow | |

**변경 사항**: 없음 (URL 형식만 변경 — GCS URL → 로컬 정적 경로)

### expertise_items — 전문 분야

| 컬럼 | 타입 | 제약 | 설명 |
|:--|:--|:--|:--|
| id | Integer | PK | |
| title | String(100) | NOT NULL | |
| description | Text | nullable | |
| icon_name | String(50) | nullable | lucide 아이콘 이름 |
| sort_order | Integer | default=0 | |
| created_at | DateTime | default=utcnow | |

### shop_info — 매장 정보 (key-value)

| 컬럼 | 타입 | 제약 | 설명 |
|:--|:--|:--|:--|
| id | Integer | PK | |
| key | String(50) | UNIQUE, NOT NULL | 예: `address`, `phone`, `hours`, `description` |
| value | Text | nullable | |

## 컬럼 명명 규칙

- snake_case
- Boolean은 `is_xxx` 또는 `xxx_ed`
- 외래키는 `<table>_id`
- 타임스탬프는 `created_at`, `updated_at` (필요 시), 만료는 `expires_at`

## Alembic 운영

### 초기 마이그레이션
```bash
cd artifacts/api-server/python
alembic init migrations
# migrations/env.py에서 target_metadata = Base.metadata 설정
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### 신규 컬럼 추가
```bash
alembic revision --autogenerate -m "add users.is_active"
# migrations/versions/*.py 검토 후
alembic upgrade head
```

### 운영 배포
- 앱 시작 시 자동 `upgrade`는 하지 않는다.
- CI/CD나 수동 명령으로 명시적으로 실행.

## 데이터 이주 (운영 환경)

- 기존 Replit Postgres에는 이미 `run_migrations()`이 실행된 상태일 가능성이 높음
- Alembic 도입 시: 현재 DB 상태를 `alembic stamp head`로 표시 (마이그레이션 실행은 건너뛰고 버전만 기록)
- 향후 변경분은 Alembic으로만 관리

## 파킹랏 (다음 스프린트 이후)

| # | 항목 | 사유 |
|:--|:--|:--|
| D-1 | `phone_otps.attempts` 컬럼 추가 | 브루트 포스 방지 |
| D-2 | `users.is_active` 컬럼 추가 | 사용자 차단 기능 |
| D-3 | `reservations.updated_at` 컬럼 추가 | 변경 추적 |
| D-4 | `reservations.status`를 ENUM 타입으로 변환 | 데이터 정합성 (Postgres ENUM) |
| D-5 | `audit_logs` 테이블 신규 | 관리자 변경 이력 |
