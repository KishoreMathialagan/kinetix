from typing import Any

from fastapi import status


class AppException(Exception):
    """Base application exception."""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        code: str = "INTERNAL_SERVER_ERROR",
        errors: list[Any] | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.code = code
        self.errors = errors or []
        super().__init__(self.message)

class ValidationError(AppException):
    def __init__(self, message: str = "Validation error", errors: list[Any] | None = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            errors=errors,
        )

class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication failed", errors: list[Any] | None = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="AUTHENTICATION_ERROR",
            errors=errors,
        )

class AuthorizationError(AppException):
    def __init__(self, message: str = "Permission denied", errors: list[Any] | None = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            code="AUTHORIZATION_ERROR",
            errors=errors,
        )

class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", errors: list[Any] | None = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            errors=errors,
        )

class ConflictError(AppException):
    def __init__(self, message: str = "Resource conflict", errors: list[Any] | None = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            code="CONFLICT",
            errors=errors,
        )

class BusinessRuleError(AppException):
    def __init__(self, message: str = "Business rule violation", errors: list[Any] | None = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BUSINESS_RULE_ERROR",
            errors=errors,
        )
