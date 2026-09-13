"""
JWT Authentication Middleware for Django Channels.

Authenticates WebSocket connections using JWT access tokens passed via:
1. Query string: ws://host/ws/<path>/?token=<jwt_access_token>
2. Authorization header: Authorization: Bearer <jwt_access_token>

Attaches the authenticated User instance (with roles) to scope["user"],
or AnonymousUser if the token is missing, expired, or invalid.
"""
import logging
from typing import Any
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_jwt(token_str: str) -> Any:
    """Validate JWT token and return active User or AnonymousUser."""
    from apps.accounts.models import User

    try:
        token = AccessToken(token_str)
        user_id = token.get("user_id")
        if not user_id:
            return AnonymousUser()

        user = User.objects.get(id=user_id)
        if not user.is_active:
            logger.warning("WS JWT rejected: user %s is inactive", user_id)
            return AnonymousUser()

        return user
    except (InvalidToken, TokenError) as exc:
        logger.debug("WS JWT token invalid or expired: %s", exc)
        return AnonymousUser()
    except Exception as exc:
        logger.warning("WS JWT auth unexpected error: %s", exc)
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    ASGI middleware that parses JWT from query string or headers and sets scope['user'].
    """

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> Any:
        # If user is already authenticated (e.g. injected in test environment), keep it
        existing_user = scope.get("user")
        if existing_user and getattr(existing_user, "is_authenticated", False):
            return await super().__call__(scope, receive, send)

        token = None

        # 1. Check query parameters (?token=...)
        query_string = scope.get("query_string", b"").decode("utf-8")
        if query_string:
            params = parse_qs(query_string)
            token_list = params.get("token")
            if token_list:
                token = token_list[0]

        # 2. Fallback to Authorization header if query parameter was absent
        if not token:
            headers = dict(scope.get("headers", []))
            auth_header = headers.get(b"authorization", b"").decode("utf-8")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:].strip()

        # 3. Resolve user
        if token:
            scope["user"] = await get_user_from_jwt(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner: Any) -> Any:
    """Helper stack wrapping an ASGI application with JWTAuthMiddleware."""
    return JWTAuthMiddleware(inner)
