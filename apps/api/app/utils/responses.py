from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: T | None = None

class ErrorResponse(BaseModel):
    success: bool = False
    code: str
    message: str
    errors: list[Any] = []

class PaginatedData(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

class PaginatedResponse(SuccessResponse[PaginatedData[T]], Generic[T]):
    pass
