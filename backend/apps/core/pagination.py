"""Custom pagination classes for consistent list endpoints."""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsPagination(PageNumberPagination):
    """
    Default pagination: 20 items/page, max 100 items/page.

    Response includes 'pagination' meta block compatible with
    the frontend's list components.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
    page_query_param = "page"

    def get_paginated_response(self, data) -> Response:  # type: ignore[override]
        return Response(
            {
                "success": True,
                "data": data,
                "meta": {
                    "pagination": {
                        "count": self.page.paginator.count,
                        "total_pages": self.page.paginator.num_pages,
                        "current_page": self.page.number,
                        "page_size": self.get_page_size(self.request),
                        "next": self.get_next_link(),
                        "previous": self.get_previous_link(),
                    }
                },
            }
        )

    def get_paginated_response_schema(self, schema):  # type: ignore[override]
        return {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "data": schema,
                "meta": {
                    "type": "object",
                    "properties": {
                        "pagination": {
                            "type": "object",
                            "properties": {
                                "count": {"type": "integer"},
                                "total_pages": {"type": "integer"},
                                "current_page": {"type": "integer"},
                                "page_size": {"type": "integer"},
                                "next": {"type": "string", "nullable": True},
                                "previous": {"type": "string", "nullable": True},
                            },
                        }
                    },
                },
            },
        }


class LargeResultsPagination(PageNumberPagination):
    """Pagination for bulk export-style endpoints: 200 items/page."""

    page_size = 200
    page_size_query_param = "page_size"
    max_page_size = 1000
