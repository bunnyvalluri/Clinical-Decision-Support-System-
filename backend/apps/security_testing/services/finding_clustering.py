"""
Security Finding Clustering & Multi-Provider Deduplication Service (Prompt 44).
Correlates findings across Strix, Agentic Bug Hunter, and Pentest-Agents into
unified clusters so that identical vulnerabilities are never counted multiple times.
"""
import logging
from typing import Optional, Tuple
from apps.security_testing.models import (
    SecurityFinding,
    SecurityFindingCluster,
    FindingState,
)
from apps.security_testing.services.fingerprint import FindingFingerprintService

logger = logging.getLogger("security_testing.clustering")


class FindingClusteringService:
    """
    Groups findings into deterministic clusters based on SHA-256 fingerprint.
    """

    @classmethod
    def correlate_finding(
        cls, finding: SecurityFinding, provider_name: str
    ) -> Tuple[SecurityFindingCluster, bool]:
        """
        Correlates a finding into an existing cluster or creates a new one.
        Returns: (cluster, is_new_cluster)
        """
        # Ensure finding has a fingerprint
        if not finding.fingerprint:
            finding.fingerprint = FindingFingerprintService.generate_fingerprint(
                vulnerability_type=finding.vulnerability_type,
                endpoint=finding.affected_endpoint,
                cwe_id=finding.cwe_id,
                affected_component=finding.affected_component,
            )
            finding.save(update_fields=["fingerprint"])

        cluster, created = SecurityFindingCluster.objects.get_or_create(
            cluster_hash=finding.fingerprint,
            defaults={
                "title": finding.title,
                "vulnerability_type": finding.vulnerability_type,
                "affected_endpoint": finding.affected_endpoint,
                "primary_finding": finding,
                "providers": [provider_name],
                "confidence_score": finding.confidence,
                "status": finding.state,
            },
        )

        if not created:
            # Cluster existed: add finding and update provider list
            cluster.findings.add(finding)
            providers = list(cluster.providers or [])
            if provider_name not in providers:
                providers.append(provider_name)
                cluster.providers = providers
                cluster.save(update_fields=["providers"])

            # If there's already a primary finding, mark this finding as DUPLICATE
            if cluster.primary_finding and cluster.primary_finding.id != finding.id:
                finding.state = FindingState.DUPLICATE
                finding.save(update_fields=["state"])
                logger.info(
                    f"Finding {finding.id} correlated to existing cluster {cluster.cluster_hash[:8]} as DUPLICATE"
                )
        else:
            cluster.findings.add(finding)
            logger.info(
                f"Created new finding cluster {cluster.cluster_hash[:8]} for finding {finding.id}"
            )

        return cluster, created
