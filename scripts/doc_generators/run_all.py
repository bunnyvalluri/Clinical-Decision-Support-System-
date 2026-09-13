"""
Master runner for complete professional documentation generation.
"""
import importlib
from pathlib import Path
import sys

# Add scripts/doc_generators to path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

import generate_root_and_arch
import generate_frontend_backend
import generate_database_api
import generate_ml_realtime
import generate_security_testing
import generate_deployment_dev_proj

EXPECTED_FILES = [
    "README.md",
    "01-project-overview.md",
    "02-requirements.md",
    "03-system-architecture.md",
    "04-technology-stack.md",
    "05-project-structure.md",
    # architecture/
    "architecture/overview.md",
    "architecture/frontend-architecture.md",
    "architecture/backend-architecture.md",
    "architecture/ml-architecture.md",
    "architecture/realtime-architecture.md",
    "architecture/database-architecture.md",
    "architecture/security-architecture.md",
    "architecture/deployment-architecture.md",
    # frontend/
    "frontend/overview.md",
    "frontend/setup.md",
    "frontend/architecture.md",
    "frontend/components.md",
    "frontend/state-management.md",
    "frontend/api-integration.md",
    "frontend/websocket-integration.md",
    "frontend/ui-ux-guidelines.md",
    # backend/
    "backend/overview.md",
    "backend/setup.md",
    "backend/django-architecture.md",
    "backend/apps.md",
    "backend/services.md",
    "backend/serializers.md",
    "backend/permissions.md",
    "backend/error-handling.md",
    "backend/configuration.md",
    # database/
    "database/overview.md",
    "database/neon-postgresql.md",
    "database/schema.md",
    "database/models.md",
    "database/relationships.md",
    "database/indexes.md",
    "database/migrations.md",
    "database/backup-recovery.md",
    # api/
    "api/overview.md",
    "api/authentication.md",
    "api/patients.md",
    "api/clinical-records.md",
    "api/predictions.md",
    "api/models.md",
    "api/reports.md",
    "api/notifications.md",
    "api/dashboard.md",
    "api/audit.md",
    "api/websocket-api.md",
    # ml/
    "ml/overview.md",
    "ml/dataset.md",
    "ml/data-preprocessing.md",
    "ml/feature-engineering.md",
    "ml/training.md",
    "ml/svm.md",
    "ml/random-forest.md",
    "ml/adaboost.md",
    "ml/model-evaluation.md",
    "ml/model-selection.md",
    "ml/model-versioning.md",
    "ml/inference.md",
    "ml/explainability.md",
    "ml/mlops.md",
    # realtime/
    "realtime/overview.md",
    "realtime/redis.md",
    "realtime/django-channels.md",
    "realtime/websockets.md",
    "realtime/events.md",
    "realtime/notifications.md",
    "realtime/failure-recovery.md",
    # background-jobs/
    "background-jobs/celery.md",
    "background-jobs/tasks.md",
    "background-jobs/retries.md",
    "background-jobs/monitoring.md",
    # security/
    "security/overview.md",
    "security/authentication.md",
    "security/authorization.md",
    "security/rbac.md",
    "security/data-protection.md",
    "security/api-security.md",
    "security/websocket-security.md",
    "security/audit-logging.md",
    "security/security-checklist.md",
    # testing/
    "testing/overview.md",
    "testing/backend-testing.md",
    "testing/frontend-testing.md",
    "testing/api-testing.md",
    "testing/database-testing.md",
    "testing/ml-testing.md",
    "testing/websocket-testing.md",
    "testing/integration-testing.md",
    "testing/test-strategy.md",
    # deployment/
    "deployment/overview.md",
    "deployment/local-development.md",
    "deployment/docker.md",
    "deployment/environment-variables.md",
    "deployment/production.md",
    "deployment/nginx.md",
    "deployment/ci-cd.md",
    "deployment/monitoring.md",
    "deployment/troubleshooting.md",
    # development/
    "development/getting-started.md",
    "development/coding-standards.md",
    "development/git-workflow.md",
    "development/branching-strategy.md",
    "development/pull-requests.md",
    "development/contribution-guide.md",
    # project/
    "project/roadmap.md",
    "project/changelog.md",
    "project/known-limitations.md",
    "project/future-enhancements.md",
    "project/glossary.md",
]


def run():
    print("==================================================")
    print("STARTING COMPLETE DOCUMENTATION GENERATION")
    print("==================================================")

    generate_root_and_arch.generate()
    generate_frontend_backend.generate()
    generate_database_api.generate()
    generate_ml_realtime.generate()
    generate_security_testing.generate()
    generate_deployment_dev_proj.generate()

    print("\n==================================================")
    print("VERIFYING GENERATED FILES")
    print("==================================================")
    docs_root = Path(r"c:\4-1\docs")
    missing = []
    empty = []
    total_bytes = 0

    for rel in EXPECTED_FILES:
        target = docs_root / rel
        if not target.exists():
            missing.append(rel)
        else:
            size = target.stat().st_size
            if size == 0:
                empty.append(rel)
            total_bytes += size

    print(f"Total Expected Files: {len(EXPECTED_FILES)}")
    print(f"Total Found Files:    {len(EXPECTED_FILES) - len(missing)}")
    print(f"Total Content Size:   {total_bytes:,} bytes (~{total_bytes/1024:.1f} KB)")

    if missing:
        print(f"ERROR: Missing files: {missing}")
        sys.exit(1)
    if empty:
        print(f"ERROR: Empty files: {empty}")
        sys.exit(1)

    print("\nALL 100+ DOCUMENTATION FILES SUCCESSFULLY VERIFIED AND COMPLETE!")


if __name__ == "__main__":
    run()
