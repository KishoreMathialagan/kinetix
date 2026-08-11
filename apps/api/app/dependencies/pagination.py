
from fastapi import Query

from app.utils.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE


class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
        sort_by: str | None = Query(None, description="Field to sort by"),
        sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order"),
        search: str | None = Query(None, description="Search query"),
    ):
        self.page = page
        self.page_size = page_size
        self.sort_by = sort_by
        self.sort_order = sort_order
        self.search = search
        self.offset = (page - 1) * page_size
