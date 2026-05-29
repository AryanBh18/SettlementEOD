from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import uuid

from app.config import settings
from app.database import get_db

logger = logging.getLogger(__name__)

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
)
from app.routers import eod, transactions
from app.routers import auth as auth_router
from app.routers import upload as upload_router
from app.routers import audit as audit_router
from app.routers import settings_router
from app.routers import simulation as simulation_router
from app.routers import cutoff as cutoff_router

app = FastAPI(
    title="EOD Settlement System",
    description="Automated End-of-Day clearing and settlement processing for national payment switch (BNETS)",
    version="1.0.0",
)

# CORS — restrict to known methods and headers only
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)


# Request ID + security headers middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Disable legacy XSS auditor — CSP is the modern control; the old header can introduce vulns
    response.headers["X-XSS-Protection"] = "0"
    return response


# Global exception handler — log the full traceback, return generic message to client
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
        exc_info=exc,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": getattr(request.state, "request_id", None),
        },
    )


# Register routers
app.include_router(auth_router.router)
app.include_router(eod.router)
app.include_router(transactions.router)
app.include_router(upload_router.router)
app.include_router(audit_router.router)
app.include_router(settings_router.router)
app.include_router(simulation_router.router)
app.include_router(cutoff_router.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "EOD Settlement System", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


@app.get("/health/db", tags=["Health"])
async def health_check_db(db: AsyncSession = Depends(get_db)):
    """Verifies database connectivity. Returns 503 if the database is unreachable."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as exc:
        logger.error("Database health check failed", exc_info=exc)
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"},
        )
