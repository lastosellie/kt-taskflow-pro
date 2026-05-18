import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import tasks

# 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskFlow Pro API",
    description="팀 업무 관리 풀스택 웹 앱 — MVP",
    version="0.1.0",
)

# MVP: 모든 origin 허용 (확장 단계에서 도메인 제한)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # 02-specs.md 기준: 입력 검증 실패는 400 반환
    errors = exc.errors()
    first = errors[0] if errors else {}
    loc = first.get("loc", [])
    field = str(loc[-1]) if loc else "unknown"
    msg = first.get("msg", "validation error")
    return JSONResponse(status_code=400, content={"detail": f"{field}: {msg}"})


app.include_router(tasks.router, prefix="/api")

# API 라우터 등록 후 정적 파일 서빙 — /api/* 보다 뒤에 마운트해야 우선순위 유지
_frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.isdir(_frontend_dir):
    app.mount("/", StaticFiles(directory=_frontend_dir, html=True), name="static")
