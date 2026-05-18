# 04. Tasks

> TaskFlow Pro — MVP 개발 계획 (Phase 1~3)

**확장 단계(JWT, 팀, Kanban, 채팅, CI/CD)는 이 문서에 포함하지 않는다. 별도 문서에서 다룬다.**

---

## 진행 규칙

| 규칙 | 내용 |
|------|------|
| **순서 준수** | Phase 1 → 2 → 3 순서대로만 진행한다 |
| **병렬 금지** | 이전 단계 검증이 완료되기 전 다음 단계를 시작하지 않는다 |
| **단계별 검증** | 각 단계의 '검증 방법'을 직접 확인하고 ✅ 체크 후 다음으로 넘어간다 |
| **완료 기준** | 검증 방법이 모두 통과해야 해당 Phase 완료로 간주한다 |

---

## Phase 1 — 설계 ✅ 완료

> CLAUDE.md + docs/ 6종 작성

| # | 단계 | 산출물 | 검증 방법 |
|---|------|--------|----------|
| 1 | Git 저장소 초기화 + GitHub 원격 연결 | `.git/`, `origin` remote | `git remote -v` 로 원격 주소 확인 |
| 2 | CLAUDE.md 작성 (역할·절대규칙·모호한 요청 프로토콜) | `CLAUDE.md` | 파일 열어 5개 절대규칙 항목 존재 확인 |
| 3 | docs/ 폴더 + 00~05 파일 골격 생성 | `docs/00~05.md` | `ls docs/` 로 6개 파일 존재 확인 |
| 4 | `00-overview.md` 작성 (프로젝트 지도) | `docs/00-overview.md` | 매핑표·읽기 순서·관심사 분리 설명 포함 확인 |
| 5 | `01-product.md` 작성 (목표·페르소나·MVP 범위) | `docs/01-product.md` | 성공 기준 5개 항목 포함 확인 |
| 6 | `02-specs.md` 작성 (Task 모델·API 5개·UI 명세) | `docs/02-specs.md` | API 엔드포인트 5개, 검증 규칙 표 존재 확인 |
| 7 | `03-design.md` 작성 (ADR 8개·의존성 정책) | `docs/03-design.md` | 8개 결정 항목 + 의존성 추가 정책 섹션 존재 확인 |
| 8 | `04-tasks.md` 작성 (현재 문서) | `docs/04-tasks.md` | Phase 1~3 체크리스트 전체 포함 확인 |
| 9 | `05-conventions.md` 작성 (컨벤션·Git 전략·PR 규칙) | `docs/05-conventions.md` | 네이밍 규칙·브랜치 전략 섹션 존재 확인 |
| 10 | Phase 1 최종 검토 + `git push` | GitHub `main` 브랜치 | GitHub에서 docs/ 6개 파일 내용 확인 |

---

## Phase 2 — 백엔드 ⬜ 대기

> `backend/` 디렉터리, FastAPI, CRUD API 5개, Swagger 확인

| # | 단계 | 산출물 | 검증 방법 |
|---|------|--------|----------|
| 1 | `backend/` 폴더 생성 + Python 가상환경 설정 | `backend/venv/` | `python -m uvicorn --version` 실행 성공 |
| 2 | `requirements.txt` 작성 및 패키지 설치 | `backend/requirements.txt` | `pip install -r requirements.txt` 오류 없음 |
| 3 | FastAPI 앱 진입점 생성 + 서버 기동 확인 | `backend/main.py` | `http://localhost:8000/docs` Swagger UI 접속 |
| 4 | SQLAlchemy DB 연결 설정 (SQLite) | `backend/database.py` | 서버 기동 시 `tasks.db` 파일 자동 생성 |
| 5 | Task SQLAlchemy 모델 정의 | `backend/models.py` | `tasks` 테이블 7개 컬럼 DDL 정상 생성 |
| 6 | Pydantic 스키마 정의 (`TaskCreate`, `TaskUpdate`, `TaskResponse`) | `backend/schemas.py` | `TaskUpdate` 모든 필드 Optional 확인 |
| 7 | `POST /api/tasks` 구현 + 검증 규칙 적용 | `backend/routers/tasks.py` | Swagger에서 title 없이 요청 → `400` 반환 확인 |
| 8 | `GET /api/tasks` + `GET /api/tasks/{id}` 구현 | 동일 라우터 | 목록 응답에 `description` 없음 / 단건에 있음 확인 |
| 9 | `PUT /api/tasks/{id}` 부분 수정 구현 | 동일 라우터 | status만 보내도 title 기존값 유지 확인 |
| 10 | `DELETE /api/tasks/{id}` 구현 + 전체 검증 | 동일 라우터 | Swagger에서 CRUD 5개 엔드포인트 전부 `2xx` 확인 |

---

## Phase 3 — 프론트엔드 ⬜ 대기

> `frontend/` 디렉터리, HTML + Vanilla JS + Tailwind CDN, API 연결, git push

| # | 단계 | 산출물 | 검증 방법 |
|---|------|--------|----------|
| 1 | `frontend/index.html` 기본 구조 + Tailwind CDN 연결 | `frontend/index.html` | 브라우저에서 파일 열어 Tailwind 스타일 적용 확인 |
| 2 | 다크모드 초기화 스크립트 (`<head>` 인라인) + 테마 토글 버튼 | `frontend/theme.js` | 토글 클릭 → `<html class="dark">` 추가·제거 확인 |
| 3 | `localStorage('theme')` 저장 + `prefers-color-scheme` 초기값 | 동일 파일 | 새로고침 후 선택한 테마 유지 확인 |
| 4 | 태스크 목록 카드 UI (status 배지 + D-N HH:MM 표시) | `frontend/app.js` | 하드코딩 더미 데이터로 카드 렌더링 확인 |
| 5 | `GET /api/tasks` 폴링 연결 (3초 간격) + 카드 실시간 갱신 | 동일 파일 | 백엔드 기동 후 카드 목록 자동 표시 확인 |
| 6 | 태스크 추가 폼 (title / due_at / status) + `POST /api/tasks` 연결 | 동일 파일 | 폼 제출 → 카드 목록에 즉시 추가 확인 |
| 7 | 수정 모달 (카드 클릭 → 모달 열기) + `PUT /api/tasks/:id` 연결 | 동일 파일 | 카드 클릭 → 모달 표시 → 저장 → 카드 갱신 확인 |
| 8 | 삭제 확인 다이얼로그 + `DELETE /api/tasks/:id` 연결 + 360px 반응형 최종 확인 + `git push` | GitHub `main` | Chrome 360px 뷰에서 레이아웃 깨짐 없음 + CRUD 4종 전부 동작 확인 |

---

## MVP 완료 체크리스트

> `01-product.md`의 성공 기준 5개와 대응한다.

| 성공 기준 | 대응 단계 | 상태 |
|----------|----------|------|
| 새로고침 후 데이터 유지 | Phase 2-4 (DB 저장) | ⬜ |
| 360px 레이아웃 깨짐 없음 | Phase 3-8 | ⬜ |
| API 응답 200ms 이내 | Phase 2-10 (로컬 기준) | ⬜ |
| CRUD 4종 화면에서 동작 | Phase 3-6·7·8 | ⬜ |
| 테마 토글 작동 (새로고침 유지) | Phase 3-2·3 | ⬜ |
