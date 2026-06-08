# 아키텍처 다이어그램 — 도메인 폴더 + 의존성 방향

Sprint 1 목표 구조. `core/`는 공통 인프라, `domains/*`는 비즈니스 도메인. 화살표는 의존 방향(→ 쪽이 의존 대상).

```mermaid
graph TD
    subgraph 진입점
        MAIN["main.py\n라우터 조립, CORS, StaticFiles"]
    end

    subgraph core["core/ — 공통 인프라"]
        CFG["config.py\nSettings (pydantic-settings)"]
        DB["database.py\nengine, SessionLocal, Base"]
        SEC["security.py\nJWT, bcrypt"]
        DEPS["deps.py\nget_db, get_current_user, get_admin_user"]
    end

    subgraph domains["domains/ — 비즈니스 도메인"]
        subgraph auth["auth/ — 3레이어"]
            AR["router.py"]
            AS["service.py"]
            AREP["repository.py"]
            AM["models.py (User, PhoneOTP)"]
            ASCH["schemas.py"]
        end

        subgraph reservations["reservations/ — 3레이어"]
            RR["router.py"]
            RS["service.py"]
            RREP["repository.py"]
            RM["models.py (Reservation)"]
            RSCH["schemas.py"]
        end

        subgraph storage["storage/ — 3레이어"]
            STR["router.py"]
            STS["service.py"]
            STREP["repository.py (LocalStorageRepository)"]
            STSCH["schemas.py"]
        end

        subgraph photos["photos/ — 2레이어"]
            PR["router.py"]
            PS["service.py"]
        end

        subgraph expertise["expertise/ — 2레이어"]
            ER["router.py"]
            ES["service.py"]
        end

        subgraph shop_info["shop_info/ — 2레이어"]
            SIR["router.py"]
            SIS["service.py"]
        end
    end

    subgraph migrations["migrations/ — Alembic"]
        MIG["env.py, versions/"]
    end

    MAIN --> AR
    MAIN --> RR
    MAIN --> STR
    MAIN --> PR
    MAIN --> ER
    MAIN --> SIR

    AR --> AS
    AS --> AREP
    AREP --> AM

    RR --> RS
    RS --> RREP
    RREP --> RM

    RS --> AM

    STR --> STS
    STS --> STREP

    PR --> PS
    ER --> ES
    SIR --> SIS

    AR --> DEPS
    RR --> DEPS
    STR --> DEPS
    PR --> DEPS
    ER --> DEPS
    SIR --> DEPS

    DEPS --> SEC
    DEPS --> DB

    MIG --> DB
```

의존성 규칙 요약:
- `router` → `service` → `repository` → `models` (3레이어)
- `router` → `service` (2레이어, ORM 직접 접근)
- `domains/reservations/service` → `domains/auth/models` (User 타입 참조만, auth service에는 의존하지 않음)
- `core/*`는 어느 도메인에서도 import 가능하나, `domains/*`끼리는 최소화
