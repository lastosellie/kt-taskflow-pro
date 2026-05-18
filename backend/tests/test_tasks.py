import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.main import app
from backend.database import Base, get_db

# StaticPool: 모든 세션이 단일 커넥션 공유 → 인메모리 DB 소멸 방지
_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def _override_get_db():
    db = _TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


client = TestClient(app)

# ── 헬퍼 ──────────────────────────────────────────────
def _make_task(**kwargs):
    payload = {"title": "기본 태스크", **kwargs}
    return client.post("/api/tasks", json=payload)


# ── CREATE ─────────────────────────────────────────────
def test_create_task_success():
    res = _make_task(title="디자인 검토", due_at="2026-06-01T18:00:00Z")
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "디자인 검토"
    assert data["status"] == "todo"
    assert data["due_at"] == "2026-06-01T18:00:00Z"
    assert "description" in data  # 단건 응답에 description 포함


def test_create_task_missing_title():
    res = client.post("/api/tasks", json={"status": "todo"})
    assert res.status_code == 400
    assert "title" in res.json()["detail"]


def test_create_task_invalid_due_at():
    res = _make_task(due_at="2026/06/01 18:00")  # ISO 8601 형식 아님
    assert res.status_code == 400
    assert "due_at" in res.json()["detail"]


# ── READ ───────────────────────────────────────────────
def test_get_tasks():
    _make_task(title="태스크 A")
    _make_task(title="태스크 B")
    res = client.get("/api/tasks")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    # 목록 응답에 description 없음
    assert "description" not in data[0]


def test_get_task_success():
    created = _make_task(title="단건 조회", description="상세 설명").json()
    res = client.get(f"/api/tasks/{created['id']}")
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "단건 조회"
    assert data["description"] == "상세 설명"  # 단건에 description 포함


def test_get_task_not_found():
    res = client.get("/api/tasks/99999")
    assert res.status_code == 404
    assert res.json()["detail"] == "task not found"


# ── UPDATE ─────────────────────────────────────────────
def test_update_task_success():
    created = _make_task(title="수정 전 제목").json()
    res = client.put(f"/api/tasks/{created['id']}", json={"status": "in_progress"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "in_progress"
    # 부분 수정 — title 기존값 유지
    assert data["title"] == "수정 전 제목"


def test_update_task_not_found():
    res = client.put("/api/tasks/99999", json={"status": "done"})
    assert res.status_code == 404
    assert res.json()["detail"] == "task not found"


# ── DELETE ─────────────────────────────────────────────
def test_delete_task_success():
    created = _make_task(title="삭제 대상").json()
    res = client.delete(f"/api/tasks/{created['id']}")
    assert res.status_code == 204
    # 삭제 후 조회 시 404
    assert client.get(f"/api/tasks/{created['id']}").status_code == 404


def test_delete_task_not_found():
    res = client.delete("/api/tasks/99999")
    assert res.status_code == 404
    assert res.json()["detail"] == "task not found"
