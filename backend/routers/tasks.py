from datetime import datetime, UTC
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Task
from ..schemas import TaskCreate, TaskUpdate, TaskListResponse, TaskDetailResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskDetailResponse, status_code=201)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("", response_model=List[TaskListResponse])
def get_tasks(db: Session = Depends(get_db)):
    # 최신 생성순 정렬
    return db.query(Task).order_by(Task.created_at.desc()).all()


@router.get("/{task_id}", response_model=TaskDetailResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    return task


@router.put("/{task_id}", response_model=TaskDetailResponse)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="task not found")

    for field, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    task.updated_at = datetime.now(UTC)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    db.delete(task)
    db.commit()
    return Response(status_code=204)
