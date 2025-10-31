from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .core.config import settings
from .api import jobs, contacts, calendar, notes, resume, convert, personal, letter, files, reminder
from .middleware import LoggingMiddleware
from .utils.logger import logger

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug
)


# Exception handlers for logging all failures
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handler for request validation errors (422 errors).
    Logs validation errors in detail for debugging.
    """
    error_details = exc.errors()
    logger.error(
        "Request validation failed",
        method=request.method,
        path=str(request.url.path),
        errors=error_details,
        body=await request.body() if request.method in ["POST", "PUT", "PATCH"] else None
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": error_details,
            "body": str(await request.body()) if request.method in ["POST", "PUT", "PATCH"] else None
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handler for HTTP exceptions.
    Logs all HTTP errors (4xx, 5xx).
    """
    logger.error(
        f"HTTP {exc.status_code} error",
        method=request.method,
        path=str(request.url.path),
        status_code=exc.status_code,
        detail=exc.detail
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handler for unhandled exceptions.
    Logs all unexpected errors.
    """
    logger.error(
        "Unhandled exception",
        method=request.method,
        path=str(request.url.path),
        error=str(exc),
        error_type=type(exc).__name__
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )


# CORS middleware (must be added before logging middleware to ensure headers are added first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins since Nginx will handle the actual filtering
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add logging middleware (must be added after CORS for proper request/response logging)
app.add_middleware(LoggingMiddleware)

# Include routers
app.include_router(jobs.router, prefix="/v1", tags=["jobs"])
app.include_router(contacts.router, prefix="/v1", tags=["contacts"])
app.include_router(calendar.router, prefix="/v1", tags=["calendar"])
app.include_router(notes.router, prefix="/v1", tags=["notes"])
app.include_router(resume.router, prefix="/v1", tags=["resume"])
app.include_router(convert.router, prefix="/v1", tags=["convert"])
app.include_router(personal.router, prefix="/v1", tags=["personal"])
app.include_router(letter.router, prefix="/v1", tags=["letter"])
app.include_router(files.router, prefix="/v1", tags=["files"])
app.include_router(reminder.router, prefix="/v1", tags=["reminder"])


@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Job Tracker API", "version": settings.app_version}


@app.get("/health")
async def health_check():
    #logger.debug("Health check endpoint accessed")
    return {"status": "healthy"}