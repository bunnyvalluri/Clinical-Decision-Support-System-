"""
Circuit breaker for Google Jules API requests.
Prevents cascading failures, infinite retry loops, and API quota depletion.
"""
import time
from typing import Optional
from integrations.jules.exceptions import JulesCircuitBreakerOpenError


class CircuitState:
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class JulesCircuitBreaker:
    """
    In-memory / coordinated circuit breaker with configurable failure threshold and cooldown.
    """
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout_seconds: float = 60.0,
        half_open_max_trials: int = 2,
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.half_open_max_trials = half_open_max_trials

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.half_open_successes = 0

    def can_execute(self) -> bool:
        """Returns True if request execution is permitted."""
        now = time.time()
        if self.state == CircuitState.OPEN:
            if self.last_failure_time and (now - self.last_failure_time >= self.recovery_timeout_seconds):
                # Transition to HALF_OPEN to trial recovery
                self.state = CircuitState.HALF_OPEN
                self.half_open_successes = 0
                return True
            return False
        return True

    def record_success(self):
        """Records a successful upstream call."""
        if self.state == CircuitState.HALF_OPEN:
            self.half_open_successes += 1
            if self.half_open_successes >= self.half_open_max_trials:
                # Fully recovered
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.last_failure_time = None
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    def record_failure(self):
        """Records an upstream call failure."""
        now = time.time()
        self.last_failure_time = now
        self.failure_count += 1

        if self.state == CircuitState.HALF_OPEN or self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

    def check_or_raise(self):
        """Raises JulesCircuitBreakerOpenError if circuit is OPEN."""
        if not self.can_execute():
            raise JulesCircuitBreakerOpenError(
                f"Circuit breaker is OPEN. Failure count: {self.failure_count}. Recovery in progress."
            )

    def reset(self):
        """Manually resets the circuit breaker to CLOSED."""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None
        self.half_open_successes = 0

    def get_status(self) -> dict:
        return {
            "state": self.state,
            "failure_count": self.failure_count,
            "last_failure_time": self.last_failure_time,
            "is_open": self.state == CircuitState.OPEN,
        }


# Default singleton instance for application use
global_jules_circuit_breaker = JulesCircuitBreaker()
