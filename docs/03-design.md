# 03. Design

> TaskFlow Pro — 설계 결정 기록 (Architecture Decision Records)

이 문서는 **왜 이 기술을 골랐는가**를 기록한다.  
결정을 번복하려면 이 표를 먼저 업데이트하고 팀 동의를 받는다.

---

## 설계 결정 8개

### 1. 백엔드 프레임워크

| 항목 | 내용 |
|------|------|
| **선택** | FastAPI |
| **대안** | Django, Express |
| **근거** | 타입 힌트 기반 자동 문서화(Swagger), 비동기 지원, 경량 구조로 MVP에 적합. Pydantic으로 요청/응답 검증을 코드 한 곳에서 관리 가능 |
| **트레이드오프** | Django 대비 내장 기능(Admin, ORM, Auth) 없음 → 직접 구현 필요. Node 생태계 불가 |

---

### 2. 프론트엔드

| 항목 | 내용 |
|------|------|
| **선택** | Vanilla JS + Tailwind CDN |
| **대안** | React, Vue |
| **근거** | 빌드 도구 없이 브라우저에서 즉시 실행. 의존성 최소화로 유지보수 부담 낮음. MVP 규모(단일 화면, 단순 상태)에서 프레임워크 오버헤드 불필요 |
| **트레이드오프** | 컴포넌트 재사용 구조 없음. 화면 복잡도가 커지면 상태 관리가 수작업으로 번잡해짐 → Kanban 확장 단계에서 프레임워크 도입 재검토 |

---

### 3. 데이터베이스 & ORM

| 항목 | 내용 |
|------|------|
| **선택** | SQLite (개발) → PostgreSQL (프로덕션) + SQLAlchemy |
| **대안** | MySQL, MongoDB, Prisma |
| **근거** | SQLAlchemy로 DB 드라이버만 교체하면 코드 변경 없이 SQLite↔PostgreSQL 전환 가능. 개발 환경에서 별도 DB 서버 불필요 |
| **트레이드오프** | SQLite는 동시 쓰기 성능 낮음 → 로컬 개발 전용. 프로덕션 배포 전 반드시 PostgreSQL로 전환 |

---

### 4. CSS 전략

| 항목 | 내용 |
|------|------|
| **선택** | Tailwind CSS 단독 사용 |
| **대안** | styled-components, CSS Modules, SCSS |
| **근거** | 유틸리티 클래스로 HTML에서 스타일을 직접 읽을 수 있어 파일 이동 불필요. Vanilla JS 환경에서 JS-in-CSS(styled-components) 사용 불가 |
| **트레이드오프** | 클래스 목록이 길어져 HTML 가독성 저하 가능. 커스텀 디자인 토큰은 `tailwind.config.js`로 관리해 중복 방지 |
| **금지** | `styled-components` 도입 불가. 인라인 `style=""` 속성은 동적 값(위치, 색상 계산)에만 허용 |

---

### 5. 실시간 데이터 동기화

| 항목 | 내용 |
|------|------|
| **선택** | 폴링 3초 간격 (MVP) |
| **대안** | WebSocket, Server-Sent Events |
| **근거** | MVP 단계에서 구현 복잡도 최소화. 10명 규모 팀에서 3초 지연은 허용 가능 |
| **트레이드오프** | 불필요한 API 호출 발생. 탭이 숨겨질 때 `document.visibilityState` 감지로 폴링 중단하여 낭비 줄임 |
| **확장** | 채팅·실시간 알림 기능 도입 시 WebSocket으로 전환. 해당 시점에 이 항목 업데이트 필수 |

---

### 6. 프론트엔드 상태 관리

| 항목 | 내용 |
|------|------|
| **선택** | 모듈 스코프 변수 + DOM 직접 갱신 |
| **대안** | Redux, Zustand, Pinia, Context API |
| **근거** | 상태가 `tasks[]` 배열 하나뿐인 MVP에서 외부 상태 라이브러리는 오버엔지니어링. 모듈 변수로 단일 진실 공급원(Single Source of Truth) 유지 가능 |
| **트레이드오프** | 상태 변경 추적 도구 없음. 화면이 2개 이상으로 늘어나면 모듈 간 상태 공유가 복잡해짐 → React/Vue 전환 시 자연스럽게 대체 |

---

### 7. 디자인 시스템

| 항목 | 내용 |
|------|------|
| **선택** | macOS UI 톤 자체 구현 |
| **대안** | Material UI, Ant Design |
| **근거** | 외부 컴포넌트 라이브러리는 Vanilla JS 환경에서 React 의존성을 유발. macOS 톤을 Tailwind 토큰으로 직접 구현하면 의존성 없이 원하는 스타일 달성 가능 |
| **트레이드오프** | 컴포넌트를 직접 만들어야 하므로 초기 구현 시간 증가 |

**디자인 토큰 (Tailwind 클래스 기준)**

| 토큰 | 클래스 | 용도 |
|------|--------|------|
| 둥근 모서리 | `rounded-xl` (12px) | 카드, 모달, 버튼 |
| 그림자 | `shadow-lg` | 카드 부양감 |
| 반투명 카드 | `backdrop-blur-sm bg-white/80` (라이트) / `bg-gray-900/80` (다크) | 카드 배경 |
| 시스템 폰트 | `font-sans` → `-apple-system, BlinkMacSystemFont, "Segoe UI"` | 전체 body |
| 터치 타깃 | `min-h-[44px] min-w-[44px]` | 버튼, 아이콘 버튼 (모바일 터치 최소 크기) |

---

### 8. 테마 (라이트 / 다크)

| 항목 | 내용 |
|------|------|
| **선택** | Tailwind `dark:` variant + `localStorage('theme')` |
| **대안** | CSS 변수 수동 전환, OS 테마만 따르기 |
| **근거** | Tailwind `darkMode: 'class'` 설정으로 `<html class="dark">` 토글만으로 전체 테마 전환. 사용자 선택을 `localStorage`에 저장해 새로고침 후에도 유지 |
| **트레이드오프** | 초기 로드 시 `localStorage` 읽기 전 짧은 깜빡임(FOUC) 가능 → `<head>` 인라인 스크립트로 즉시 클래스 적용하여 방지 |

**초기값 결정 로직**

```
localStorage('theme') 존재  →  저장된 값 사용
존재하지 않음              →  prefers-color-scheme 감지
감지 불가                  →  라이트 테마 (기본)
```

---

## 의존성 추가 정책

> **새 라이브러리·패키지는 이 문서에 사유를 먼저 기록하기 전까지 도입 불가.**

의존성 추가 요청 시 아래 형식으로 이 문서에 항목을 추가하고 팀 동의 후 `package.json`을 수정한다.

```
패키지명: 선택 이유 / 대안 대비 우위 / 번들 크기 / 제거 조건
```

현재 확정된 외부 의존성:

| 패키지 | 용도 | 확정 시점 |
|--------|------|----------|
| `fastapi` | 백엔드 프레임워크 | 설계 결정 #1 |
| `sqlalchemy` | ORM | 설계 결정 #3 |
| `pydantic` | 요청/응답 검증 (FastAPI 내장) | 설계 결정 #1 |
| `uvicorn` | ASGI 서버 | 설계 결정 #1 |
| Tailwind CSS CDN | 유틸리티 CSS | 설계 결정 #4 |
