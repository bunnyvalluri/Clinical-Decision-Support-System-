"""
Django management command to execute the Spec Kit Specification Validator
Usage: python manage.py validate_specs
"""

import sys
import subprocess
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = "Validates Healthcare CDSS specifications, requirements, and constitution"

    def handle(self, *args, **options):
        workspace_root = Path(settings.BASE_DIR).resolve()
        # In case BASE_DIR points to backend/
        if (workspace_root / "scripts" / "validate_specs.py").exists():
            script_path = workspace_root / "scripts" / "validate_specs.py"
        elif (workspace_root.parent / "scripts" / "validate_specs.py").exists():
            script_path = workspace_root.parent / "scripts" / "validate_specs.py"
        else:
            raise CommandError("Could not locate scripts/validate_specs.py")

        self.stdout.write(self.style.NOTICE("Executing Spec Kit specification validation..."))
        result = subprocess.run([sys.executable, str(script_path)])
        if result.returncode != 0:
            raise CommandError("Specification validation failed. See log output above.")
        self.stdout.write(self.style.SUCCESS("All specifications successfully validated."))
