"""
Redis-backed Rate Limiter for AI Requests.
"""
import logging
import time
from typing import Tuple
from django.core.cache import cache

logger = logging.getLogger("ai.gateway.ratelimit")


class AIRateLimiter:
    """
    Token-bucket rate limiter tracking user and role quotas in Redis.
    """

    DEFAULT_LIMITS = {
        "PATIENT": 20,       # 20 req / hour
        "NURSE": 60,         # 60 req / hour
        "DOCTOR": 120,       # 120 req / hour
        "INFORMATICIST": 150,
        "ADMIN": 300,
    }

    @classmethod
    def check_rate_limit(cls, user_id: str, role: str) -> Tuple[bool, int]:
        """
        Returns (is_allowed, remaining_requests)
        """
        limit = cls.DEFAULT_LIMITS.get(role.upper(), 30)
        cache_key = f"ai_ratelimit_{user_id}_{int(time.time() // 3600)}"

        try:
            current = cache.get(cache_key, 0)
            if current >= limit:
                logger.warning("Rate limit exceeded for user %s (role %s): %d/%d", user_id, role, current, limit)
                return False, 0

            cache.set(cache_key, current + 1, timeout=3600)
            return True, limit - (current + 1)
        except Exception as exc:
            logger.debug("Redis cache error in rate limiter: %s. Failing open.", exc)
            return True, limit
