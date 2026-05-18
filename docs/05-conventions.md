# 05. Conventions

> TaskFlow Pro — 협업 규칙 (네이밍·금지 패턴·테스트·Git)

---

## 명명 규칙 (Naming)

| 맥락 | 규칙 | 예시 |
|------|------|------|
| 백엔드 변수·함수·파일명 | `snake_case` | `get_task_by_id`, `due_at`, `task_router.py` |
| 프론트 변수·함수 | `camelCase` | `fetchTasks`, `dueAt`, `renderCard` |
| 프론트 컴포넌트 함수 | `PascalCase` | `TaskCard`, `EditModal`, `StatusBadge` |
| 식별자(변수·함수·클래스·파일명) | **영어만** | `createTask` ✅ / `태스크생성` ❌ |
| 주석 | **한국어** | `# 마감 시각이 없으면 표시 생략` |

---

## 금지 패턴 5개

| 금지 | 이유 | 대안 |
|------|------|------|
| `print()` 디버깅 | 운영 환경에 노이즈 유입, 제거 누락 시 로그 오염 | `logging` 모듈 사용 (`logger.debug / info / error`) |
| `bare except:` | 모든 예외를 삼켜 원인 추적 불가 | `except SpecificError as e:` 로 예외 명시 |
| 비밀번호·토큰 하드코딩 | 코드 유출 즉시 보안사고 | `.env` 파일 + `os.getenv("KEY")` |
| `any` 타입 (TypeScript 사용 시) | 타입 정보 소멸로 IDE 지원·검증 의미 상실 | 명시적 타입 또는 `unknown` + 타입 가드 |
| CSS `!important` | 우선순위 계단 꼬임으로 유지보수 불가 | 셀렉터 구체성 개선 또는 Tailwind 유틸리티 클래스 재조정 |

---

## 테스트 규칙

**도구**: `pytest`

| 규칙 | 내용 |
|------|------|
| 파일 위치 | `backend/tests/test_*.py` |
| 테스트 대상 | 모든 API 엔드포인트 |
| 필수 케이스 | 정상 케이스 + `400` (입력 검증 실패) + `404` (없는 id) |
| 실행 명령 | `pytest backend/tests/ -v` |
| 완료 기준 | 전체 테스트 통과 없이 Phase 완료로 간주하지 않는다 |

**최소 테스트 목록**

```
test_create_task_success          # POST 201
test_create_task_missing_title    # POST 400
test_create_task_invalid_due_at   # POST 400
test_get_tasks                    # GET 목록 200
test_get_task_success             # GET 단건 200
test_get_task_not_found           # GET 404
test_update_task_success          # PUT 200
test_update_task_not_found        # PUT 404
test_delete_task_success          # DELETE 204
test_delete_task_not_found        # DELETE 404
```

---

## Git 커밋 규칙

### 형식

```
<type>: <한국어 요약>
```

### 타입 목록

| 타입 | 사용 시점 |
|------|----------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 (코드 변경 없음) |
| `refactor` | 동작 변경 없는 코드 개선 |
| `test` | 테스트 추가·수정 |
| `chore` | 빌드·설정·패키지 변경 |

### 예시

```
feat: 태스크 생성 API 구현 (POST /api/tasks)
fix: due_at 없을 때 D-N 표시 오류 수정
docs: 02-specs.md API 응답 형식 보완
test: 태스크 삭제 404 케이스 테스트 추가
chore: requirements.txt pytest 추가
```

### 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 항상 동작하는 상태 유지. 직접 push 금지 |
| `phase/2-backend` | Phase 2 전체 작업 |
| `phase/3-frontend` | Phase 3 전체 작업 |
| `fix/<설명>` | 긴급 버그 수정 |

> MVP 단계에서는 PR 없이 `phase/*` → `main` 직접 merge 허용.  
> 팀 합류 시 PR + 1인 리뷰 규칙으로 전환한다.
