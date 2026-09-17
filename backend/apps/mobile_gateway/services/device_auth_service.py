"""
Device Authentication & Replay Protection Service.

Enforces:
1. Registration status check: Device must be ACTIVE.
2. Clock skew verification (max ±300 seconds).
3. Nonce uniqueness check against Redis (prevents replay attacks).
4. Cryptographic HMAC-SHA256 request signature verification.
"""
import hmac
import hashlib
import time
from typing import Tuple
from django.conf import settings
from django.core.cache import cache
from apps.mobile_gateway.models import MobileDevice, RegistrationStatus


class DeviceAuthService:
    MAX_CLOCK_SKEW_SECONDS = 300  # 5 minutes
    NONCE_CACHE_PREFIX = "mobile_nonce:"
    NONCE_TTL_SECONDS = 600  # 10 minutes

    @classmethod
    def verify_device_request(
        cls,
        device: MobileDevice,
        timestamp_str: str,
        nonce: str,
        raw_body: bytes,
        signature: str,
    ) -> Tuple[bool, str]:
        """
        Validates an incoming device API request.
        Returns (is_valid, error_reason).
        """
        # 1. Device Registration Status Gate
        if device.registration_status != RegistrationStatus.ACTIVE:
            return False, f"Device status is {device.registration_status}. Only ACTIVE devices can transmit."

        # 2. Timestamp & Clock Skew Validation
        try:
            req_timestamp = int(timestamp_str)
        except (ValueError, TypeError):
            return False, "Invalid timestamp header."

        current_time = int(time.time())
        if abs(current_time - req_timestamp) > cls.MAX_CLOCK_SKEW_SECONDS:
            return False, f"Timestamp skew exceeds {cls.MAX_CLOCK_SKEW_SECONDS} seconds."

        # 3. Nonce Replay Check
        if not nonce or len(nonce) < 8:
            return False, "Invalid or missing nonce."

        nonce_key = f"{cls.NONCE_CACHE_PREFIX}{device.device_identifier}:{nonce}"
        # Atomic add returns False if key already exists
        if not cache.add(nonce_key, "1", timeout=cls.NONCE_TTL_SECONDS):
            return False, "Replay attack detected: Nonce has already been used."

        # 4. Cryptographic Signature Verification
        # If device has a shared secret, compute HMAC-SHA256(secret, timestamp + nonce + body)
        secret = device.shared_secret or device.public_key
        if not secret:
            return False, "Device has no configured cryptographic credentials."

        expected_payload = f"{req_timestamp}:{nonce}:".encode("utf-8") + raw_body
        computed_sig = hmac.new(
            secret.encode("utf-8"),
            expected_payload,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(computed_sig, signature):
            return False, "Invalid request signature."

        return True, "Authenticated"
