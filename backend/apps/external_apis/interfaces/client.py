from abc import ABC, abstractmethod
from typing import Any


class ExternalAPIClient(ABC):
    """
    Abstract Base Class for all external healthcare API provider adapters.
    Enforces unified lifecycle: connect -> authenticate -> request -> validate -> normalize -> health_check.
    """

    provider_name: str = "GenericProvider"
    base_url: str = ""

    @abstractmethod
    def connect(self) -> None:
        """Initialize HTTP session, TLS contexts, or connection pooling."""
        pass

    @abstractmethod
    def authenticate(self) -> dict[str, str]:
        """Return authorization headers or API key query parameters."""
        pass

    @abstractmethod
    def request(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
        method: str = "GET",
    ) -> dict[str, Any]:
        """Execute validated HTTP request against provider."""
        pass

    @abstractmethod
    def validate_response(self, response_data: dict[str, Any]) -> bool:
        """Verify response payload schema correctness and non-empty status."""
        pass

    @abstractmethod
    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Transform raw provider response into canonical internal representation."""
        pass

    @abstractmethod
    def health_check(self) -> dict[str, Any]:
        """Perform non-invasive probe to verify endpoint availability and latency."""
        pass

    @abstractmethod
    def close(self) -> None:
        """Cleanly tear down connection pools and sessions."""
        pass
