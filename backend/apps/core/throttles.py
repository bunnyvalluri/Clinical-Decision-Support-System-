import sys
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


def is_testing() -> bool:
    return any("pytest" in arg for arg in sys.argv)


class AuthBurstRateThrottle(AnonRateThrottle):
    """
    Limits authentication attempts (login, register) to mitigate brute-force attacks.
    Default: 10 requests per minute.
    """

    scope = "auth"

    def allow_request(self, request, view):
        if is_testing():
            return True
        return super().allow_request(request, view)


class PasswordResetRateThrottle(AnonRateThrottle):
    """
    Limits password reset requests per IP to prevent spam and enumeration.
    Default: 5 requests per hour.
    """

    scope = "password_reset"

    def allow_request(self, request, view):
        if is_testing():
            return True
        return super().allow_request(request, view)


class ClinicianPredictionRateThrottle(SimpleRateThrottle):
    """
    Rate limits ML prediction inference requests per authenticated user.
    """

    scope = "prediction_request"

    def allow_request(self, request, view):
        if is_testing():
            return True
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_{self.scope}_{request.user.id}"
        return self.get_ident(request)
