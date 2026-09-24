"""
app/utils/pagination.py
──────────────────────────────────────────────────────────────────────────────
Reusable pagination utilities.

The frontend expects this shape for all list endpoints:
  {
    "data": [...],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }

We define a generic Pydantic model so every router can return the same shape.
"""

import math
from typing import Generic, TypeVar, List
from pydantic import BaseModel


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response used by all list endpoints.

    Usage in a router:
        return PaginatedResponse[ListingResponse](
            data=listings,
            total=100,
            page=1,
            limit=20,
        )
    """
    data: List[T]
    total: int
    page: int
    limit: int
    totalPages: int

    @classmethod
    def create(cls, data: List[T], total: int, page: int, limit: int) -> "PaginatedResponse[T]":
        total_pages = math.ceil(total / limit) if limit > 0 else 0
        return cls(
            data=data,
            total=total,
            page=page,
            limit=limit,
            totalPages=total_pages,
        )


def get_pagination_params(page: int = 1, limit: int = 20) -> dict:
    """
    Convert page/limit to offset/limit for SQL queries.
    offset = how many rows to skip.

    Example: page=2, limit=20 → offset=20 (skip first 20 rows)
    """
    page = max(1, page)
    limit = max(1, min(limit, 100))  # cap at 100 per page
    offset = (page - 1) * limit
    return {"offset": offset, "limit": limit, "page": page}
