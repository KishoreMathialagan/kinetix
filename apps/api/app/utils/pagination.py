from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[Any]
    total: int
    page: int
    size: int
    pages: int

    model_config = {"arbitrary_types_allowed": True}


def paginate(items: list, total: int, page: int, size: int) -> dict:
    pages = (total + size - 1) // size if size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }
