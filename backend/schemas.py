from datetime import datetime, UTC
from typing import Optional
from pydantic import BaseModel, Field, field_serializer
from .models import StatusEnum


def _to_utc_z(dt: Optional[datetime]) -> Optional[str]:
    """SQLite는 timezone 정보를 버리므로, 응답 시 UTC Z 형식으로 보정"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.isoformat().replace("+00:00", "Z")


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: StatusEnum = StatusEnum.todo
    due_at: Optional[datetime] = None


class TaskUpdate(BaseModel):
    # 부분 수정: 모든 필드 Optional — 전달된 필드만 업데이트
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[StatusEnum] = None
    due_at: Optional[datetime] = None


class TaskListResponse(BaseModel):
    id: int
    title: str
    status: StatusEnum
    due_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("due_at", "created_at", "updated_at")
    def serialize_dt(self, dt: Optional[datetime]) -> Optional[str]:
        return _to_utc_z(dt)


class TaskDetailResponse(TaskListResponse):
    description: Optional[str] = None
