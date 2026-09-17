"""
Unit tests for Healthcare External API Security & SSRF Protection:
- Localhost & Loopback IP blocking
- Private RFC 1918 subnet blocking
- Cloud Instance Metadata (169.254.169.254) blocking
- HTTPS-only protocol enforcement
- Domain allowlist enforcement
- PHI exfiltration prevention & regex boundary guarding
"""
import pytest
from apps.external_apis.security.ssrf import (
    validate_url_against_ssrf,
    check_phi_violation,
    SSRFSecurityException,
    PHIExfiltrationException,
)


class TestSSRFProtection:
    """Validate strict SSRF defense layers."""

    def test_blocks_loopback_localhost(self):
        with pytest.raises(SSRFSecurityException, match="Loopback IP"):
            validate_url_against_ssrf("https://127.0.0.1/admin")

    def test_blocks_private_rfc1918_10_network(self):
        with pytest.raises(SSRFSecurityException, match="Private IP"):
            validate_url_against_ssrf("https://10.0.1.5/internal/api")

    def test_blocks_private_rfc1918_192_network(self):
        with pytest.raises(SSRFSecurityException, match="Private IP"):
            validate_url_against_ssrf("https://192.168.1.1/router")

    def test_blocks_cloud_metadata_service_imds(self):
        with pytest.raises(SSRFSecurityException, match="Link-local|metadata"):
            validate_url_against_ssrf("https://169.254.169.254/latest/meta-data/")

    def test_blocks_insecure_http_protocol(self):
        with pytest.raises(SSRFSecurityException, match="Insecure protocol"):
            validate_url_against_ssrf("http://api.fda.gov/drug/label.json")

    def test_blocks_unauthorized_external_domain(self):
        with pytest.raises(SSRFSecurityException, match="not in the approved external API domain allowlist"):
            validate_url_against_ssrf("https://malicious-external-site.com/steal-data")

    def test_allows_approved_openfda_domain(self):
        # Should not raise exception
        validate_url_against_ssrf("https://api.fda.gov/drug/label.json")

    def test_allows_approved_nppes_domain(self):
        # Should not raise exception
        validate_url_against_ssrf("https://npiregistry.cms.hhs.gov/api/")


class TestPHIBoundaryGuard:
    """Ensure no identifiable health information is dispatched to external APIs."""

    def test_detects_and_blocks_mrn_pattern(self):
        payload = {"drug": "aspirin", "patient": "MRN-982341"}
        with pytest.raises(PHIExfiltrationException, match="protected health information"):
            check_phi_violation(payload)

    def test_detects_and_blocks_ssn_pattern(self):
        payload = {"query": "123-45-6789"}
        with pytest.raises(PHIExfiltrationException, match="protected health information"):
            check_phi_violation(payload)

    def test_detects_and_blocks_patient_id_key(self):
        payload = {"patient_id": "uuid-999", "query": "insulin"}
        with pytest.raises(PHIExfiltrationException, match="protected health information"):
            check_phi_violation(payload)

    def test_allows_sanitized_non_identifying_query(self):
        payload = {"search": 'openfda.brand_name:"Metformin"', "limit": 1}
        # Should pass without error
        check_phi_violation(payload)
