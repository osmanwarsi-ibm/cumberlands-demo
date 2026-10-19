"""Common API models, utilities, and error handling."""
import uuid
from enum import StrEnum
from typing import Any

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


class ErrorCode(StrEnum):
    """Standard error codes for API responses."""
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION"
    EXTERNAL_BOUNDARY_FAILURE = "EXTERNAL_BOUNDARY_FAILURE"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ErrorResponse(BaseModel):
    """Standard error response envelope."""
    error_code: ErrorCode
    message: str
    correlation_id: str
    details: dict[str, Any] | None = None


def generate_correlation_id() -> str:
    """Generate a unique correlation ID for request tracking."""
    return str(uuid.uuid4())


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTPException and return standard error format."""
    correlation_id = generate_correlation_id()

    # Map status codes to error codes
    status_to_error = {
        400: ErrorCode.VALIDATION_ERROR,
        401: ErrorCode.UNAUTHORIZED,
        403: ErrorCode.FORBIDDEN,
        404: ErrorCode.NOT_FOUND,
        409: ErrorCode.CONFLICT,
        502: ErrorCode.EXTERNAL_BOUNDARY_FAILURE,
        500: ErrorCode.INTERNAL_ERROR,
    }

    error_code = status_to_error.get(exc.status_code, ErrorCode.INTERNAL_ERROR)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": error_code,
            "message": exc.detail,
            "correlation_id": correlation_id,
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions and return standard error format."""
    correlation_id = generate_correlation_id()

    return JSONResponse(
        status_code=500,
        content={
            "error_code": ErrorCode.INTERNAL_ERROR,
            "message": "An internal error occurred",
            "correlation_id": correlation_id,
        }
    )


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(default="ok")
    sqlite: str = Field(default="reachable")
    fixtures_loaded: bool
    triage_mode: str
