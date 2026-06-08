# 인증 흐름 — OAuth-only (PM-06 개편)

OAuth(Google/Kakao/Naver) 단일 흐름. 로컬 ID/PW·phone OTP는 폐기.

## 1단계 — OAuth 로그인 시작

```mermaid
sequenceDiagram
    actor U as 사용자
    participant C as 클라이언트 (Login.tsx)
    participant R as auth/router.py
    participant P as OAuth Provider<br/>(Google/Kakao/Naver)

    U->>C: 소셜 로그인 버튼 클릭
    C->>R: GET /api/auth/{provider}
    alt env 미설정 (client_id 없음)
        R-->>C: 503 "OAuth가 설정되지 않았습니다"
    else 정상
        R-->>C: 302 Redirect → Provider 인증 페이지
        C->>P: GET (인증 페이지)
        U->>P: 로그인 + 권한 동의 (이메일/프로필)
        P-->>C: 302 Redirect → /api/auth/{provider}/callback?code=...
    end
```

## 2단계 — OAuth 콜백 + 관리자 자동 승격

```mermaid
sequenceDiagram
    participant C as 클라이언트
    participant R as auth/router.py
    participant S as auth/service.py
    participant P as OAuth Provider
    participant DB as PostgreSQL

    C->>R: GET /api/auth/{provider}/callback?code=...
    R->>P: POST /token (code → access_token)
    P-->>R: access_token
    R->>P: GET /userinfo (or /me) with access_token
    P-->>R: {id, email, name, profile_image}

    R->>S: upsert_oauth_user(provider, id, email, name, profile_image)
    S->>DB: SELECT users WHERE oauth_provider=? AND oauth_id=?
    alt 신규 사용자
        S->>S: is_admin = email in settings.admin_emails
        S->>DB: INSERT users (oauth_provider, oauth_id, email, name, is_admin)
    else 기존 사용자
        S->>S: 화이트리스트 매칭 시 user.is_admin = True (set-only)
        S->>DB: UPDATE users SET is_admin=true (해당 시)
    end
    DB-->>S: User
    S-->>R: User
    R->>R: create_access_token(user.id)
    R-->>C: 302 Redirect → "/" + Set-Cookie: access_token (HTTP-Only, 30일)
```

## 3단계 — 페이지 진입 후 admin 분기

```mermaid
sequenceDiagram
    actor U as 사용자
    participant C as 클라이언트 (App.tsx 진입)
    participant R as auth/router.py
    participant DB as PostgreSQL

    U->>C: 홈("/") 도착 (콜백 redirect 후)
    C->>R: GET /api/auth/me (쿠키 자동 포함)
    R->>DB: SELECT users WHERE id=? (JWT의 sub)
    DB-->>R: User
    R-->>C: 200 UserOut {id, name, email, is_admin, ...}
    alt user.is_admin == true
        C->>C: navigate("/admin")
    else
        C->>C: 그대로 홈 유지
    end
```

## 로그아웃

```mermaid
sequenceDiagram
    actor U as 사용자
    participant C as 클라이언트
    participant R as auth/router.py

    U->>C: 로그아웃 클릭
    C->>R: POST /api/auth/logout
    R-->>C: 200 {message} + Set-Cookie: access_token=; Max-Age=0
    C->>C: navigate("/")
```

## 관리자 식별 정책 (PM-06)

- `.env`의 `ADMIN_EMAILS` (콤마 구분, 예: `owner@example.com,partner@example.com`)
- 화이트리스트 매칭은 **OAuth 콜백마다** 실행 → 이메일이 화이트리스트에 늦게 추가되어도 다음 로그인부터 자동 승격
- **set-only**: 매칭되면 `is_admin=true`로 set, 비매칭이면 기존 값 유지 (강등 안 함)
- 카카오 OAuth는 Kakao Developers 콘솔에서 이메일 동의 항목을 켜둬야 매칭 가능

## 폐기된 흐름

- ~~로컬 ID/PW 회원가입~~ (`POST /api/auth/register`)
- ~~로컬 ID/PW 로그인~~ (`POST /api/auth/login`)
- ~~전화 OTP 발송/검증~~ (`POST /api/auth/phone/send`, `/verify`)
