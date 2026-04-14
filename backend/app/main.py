from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid

from app.config import settings
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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
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
