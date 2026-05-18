# 02. Specs

> TaskFlow Pro — 기술 명세 (MVP 기준)

---

## 데이터 모델

### Task

| 필드 | 타입 | 제약 | 기본값 |
|------|------|------|--------|
| `id` | INTEGER | PK, AUTO INCREMENT | — |
| `title` | VARCHAR(200) | NOT NULL | — |
| `description` | TEXT | NULL 허용 | NULL |
| `status` | ENUM | `todo` / `in_progress` / `done` | `todo` |
| `due_at` | DATETIME (UTC) | NULL 허용 | NULL |
| `created_at` | DATETIME | NOT NULL, 자동 설정 | 현재 시각 |
| `updated_at` | DATETIME | NOT NULL, 자동 갱신 | 현재 시각 |

> `*` 표시 필드(`title`)는 필수값이다.  
> `due_at`은 프런트에서 **로컬 시간 입력 → UTC 변환 후 저장**, 응답 시 UTC 그대로 반환한다.

---

## 유효성 검증 규칙

| 조건 | HTTP 상태 | 에러 예시 |
|------|-----------|----------|
| `title` 누락 또는 빈 문자열 | `400 Bad Request` | `"title is required"` |
| `title` 200자 초과 | `400 Bad Request` | `"title must be 200 characters or less"` |
| `status` 허용 값 외 | `400 Bad Request` | `"status must be todo, in_progress, or done"` |
| `due_at` ISO 8601 형식 위반 | `400 Bad Request` | `"due_at must be ISO 8601 format"` |
| 존재하지 않는 `id` 조회/수정/삭제 | `404 Not Found` | `"task not found"` |

> ISO 8601 허용 예시: `2026-05-12T18:00:00Z`, `2026-05-12T18:00:00+09:00`

---

## REST API

**Base URL**: `/api/tasks`  
**Content-Type**: `application/json`

---

### POST `/api/tasks` — 태스크 생성

**Request Body**
```json
{
  "title": "디자인 시안 검토",
  "description": "피그마 링크 확인 후 피드백",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00Z"
}
```

**Response `201 Created`**
```json
{
  "id": 1,
  "title": "디자인 시안 검토",
  "description": "피그마 링크 확인 후 피드백",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00Z",
  "created_at": "2026-05-10T09:00:00Z",
  "updated_at": "2026-05-10T09:00:00Z"
}
```

---

### GET `/api/tasks` — 태스크 목록

> `description` **제외**. 카드 목록 렌더링에 불필요한 필드는 전송하지 않는다.

**Response `200 OK`**
```json
[
  {
    "id": 1,
    "title": "디자인 시안 검토",
    "status": "todo",
    "due_at": "2026-05-12T18:00:00Z",
    "created_at": "2026-05-10T09:00:00Z",
    "updated_at": "2026-05-10T09:00:00Z"
  }
]
```

---

### GET `/api/tasks/:id` — 태스크 단건

> `description` **포함**. 상세 모달에서 사용.

**Response `200 OK`**
```json
{
  "id": 1,
  "title": "디자인 시안 검토",
  "description": "피그마 링크 확인 후 피드백",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00Z",
  "created_at": "2026-05-10T09:00:00Z",
  "updated_at": "2026-05-10T09:00:00Z"
}
```

---

### PUT `/api/tasks/:id` — 태스크 수정 (부분 수정)

> 전달된 필드만 업데이트한다. 누락된 필드는 기존 값 유지.

**Request Body** (변경할 필드만 포함)
```json
{
  "status": "in_progress",
  "due_at": "2026-05-13T12:00:00Z"
}
```

**Response `200 OK`** — 수정된 전체 태스크 반환 (단건 응답과 동일 구조)

---

### DELETE `/api/tasks/:id` — 태스크 삭제

**Response `204 No Content`** — 본문 없음

---

## 화면 명세 (UI — CRUD 4종)

### C — 태스크 추가 (Create)

- 상단 고정 **"+ 새 태스크"** 버튼 클릭 시 폼 노출
- 입력 필드: `title` (필수) / `due_at` (날짜+시간 picker) / `status` (드롭다운, 기본 `todo`)
- `description`은 선택 입력 (textarea)
- 제출 시 `POST /api/tasks` 호출 → 성공 시 목록 맨 위에 카드 추가

### R — 태스크 목록 (Read)

- 태스크를 **카드** 형태로 나열
- 카드 내 표시 항목:
  - `title`
  - `status` 배지 (`todo` / `in_progress` / `done` 색상 구분)
  - `due_at` → **D-N HH:MM** 형식으로 표시
    - 예: `D-3 18:00` (3일 뒤 18:00 마감)
    - 당일: `D-0 18:00`
    - 기한 초과: `D+2 18:00` (빨간색 강조)
    - `due_at` 없을 경우: 표시 생략

### U — 태스크 수정 (Update)

- 카드 클릭 → **수정 모달** 열림
- 모달 내 필드: `title` / `description` / `status` / `due_at` 전체 편집 가능
- 저장 버튼 클릭 시 `PUT /api/tasks/:id` 호출
- 성공 시 모달 닫힘 + 카드 즉시 갱신

### D — 태스크 삭제 (Delete)

- 카드 우측 상단 **휴지통 아이콘** 클릭
- **확인 다이얼로그** 노출: `"정말 삭제하시겠습니까?"`
- 확인 클릭 시 `DELETE /api/tasks/:id` 호출
- 성공 시 카드 목록에서 즉시 제거 (`204`)
