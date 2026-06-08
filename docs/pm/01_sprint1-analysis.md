# PM-01: Sprint 1 분석 — FastAPI 마이그레이션 + 도메인 아키텍처

- 스프린트: 1
- 날짜: 2026-05-11

## 작업 로그

| 시점 | 행동 | 내용 |
|:--|:--|:--|
| 2026-05-11 | [분석 시작] | 유저 요청: Replit 초안의 백엔드를 FastAPI(도메인 아키텍처)로 변경 |
| 2026-05-11 | [PM 직접] | 구조 빠른 파악: TS Express(src/)와 부분 마이그레이션된 FastAPI(python/) 공존. DB는 lib/db(Drizzle)와 python/models(SQLAlchemy) 둘이 정의. 도메인 후보: auth, reservations, photos, expertise, shop_info, storage |
| 2026-05-11 | [위임→researcher] | 전체 현황 조사(TS↔Python 기능 매핑, DB 스키마 차이, 프론트 API 사용처, 외부 의존, 실행 흐름). 결과 → docs/agents/researcher/01_project-survey.md |
| 2026-05-11 | [완료←researcher] | 핵심 결론: FastAPI가 실제 운영 백엔드(6도메인 28엔드포인트). TS Express·Drizzle·api-spec 사실상 미사용. Admin 사진/기술/매장정보 탭·storage UI 프론트 미연결. SMS OTP·카카오 알림톡·OAuth·GCS는 코드만 있고 실제 연동 안 됨. |
| 2026-05-11 | [PM 판단] | "FastAPI로 변경" 요청을 "이미 부분 마이그된 FastAPI를 도메인 아키텍처로 재구성 + 미정리 잔재 정리"로 재해석. 이유: 처음부터 다시 쓰는 것은 낭비, 기존 코드 자산 활용 가능 |

## 초기 관찰 사항

- 이미 FastAPI로 부분 작업이 되어 있다 → 완전 새로 쓰는 게 아니라, **도메인 아키텍처로 정리/확장**하는 작업이 본질
- DB 스키마가 두 곳(Drizzle, SQLAlchemy)에 정의되어 있어 **소스 오브 트루스 결정 필요**
- Orval 코드젠(OpenAPI → Zod/React Query) 흐름이 잡혀 있어 **API 컨트랙트 단일화** 결정 필요 (FastAPI가 OpenAPI 발급 → 프론트가 그걸 그대로 쓰는지 vs lib/api-spec을 손으로 유지)
- Replit 환경 의존(REPLIT_DOMAINS, replit.md, .replit) 확인 → 향후 배포 전략에 영향

## 판단 기록

### [판단] 작업 본질 재정의

- 결정: 유저 요청 "백엔드 FastAPI 변경"은 **이미 부분 마이그된 코드를 도메인 아키텍처로 재구성하는 작업**으로 해석한다
- 이유: FastAPI 코드가 6개 도메인 28개 엔드포인트 분량 이미 존재. TS Express는 healthz뿐이라 새로 쓸 게 없음. "변경"이 아니라 "정리+확장"이 정확
- 대안: 처음부터 새로 쓰기 — 안 함. 사유: 기존 자산 폐기 손실 큼, 작업량 폭증
- 대안: TS Express에서 FastAPI로 다시 마이그 — 안 함. 사유: TS Express는 실질 빈 껍데기

### [예정] 유저 답변 후 결정할 항목

- 스프린트 범위 (좁게: 백엔드 리팩토링만 / 중간: 미연결 Admin 탭 API 연결 포함 / 넓게: 외부 연동·SMS·OAuth 실설정 포함)
- 도메인 아키텍처 적용 깊이 (얇게: router+service / 두껍게: router+service+repository)
- 폐기 대상 처리 정책 (TS Express src/, lib/db 빈 stub, lib/api-spec 미동기)

## 명확화 질문 (유저 확인 필요)

1. **이번 스프린트 범위**: A) 백엔드 도메인 아키텍처 리팩토링만 / B) A + Admin 미연결 탭 3개 API 연결 / C) A+B + 외부 연동(SMS/OAuth/카카오 알림톡/GCS) 일부 실설정
2. **도메인 아키텍처 깊이**: 얇은 2레이어(router → service, repository는 service 안에서 ORM 직접 사용) vs 두꺼운 3레이어(router → service → repository 분리)
3. **구식 잔재 정리**: TS Express(`src/`), lib/db(빈 Drizzle stub), lib/api-spec(healthz만 있는 OpenAPI), lib/api-zod, lib/api-client-react — 모두 폐기? 일부 유지?
