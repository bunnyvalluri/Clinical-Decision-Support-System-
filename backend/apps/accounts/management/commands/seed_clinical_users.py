"""
Management command to seed initial roles, permissions, and demo clinical accounts in Neon.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from apps.accounts.models import UserRole

User = get_user_model()

DEMO_USERS = [
    {
        "email": "admin@clinical-ai.local",
        "username": "admin",
        "first_name": "System",
        "last_name": "Administrator",
        "role": UserRole.ADMIN,
        "department": "Hospital IT & Administration",
        "phone_number": "+1-555-0100",
        "password": "AdminPassword123!",
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "email": "doctor@clinical-ai.local",
        "username": "dr.sharma",
        "first_name": "Priya",
        "last_name": "Sharma",
        "role": UserRole.DOCTOR,
        "department": "Cardiovascular Medicine",
        "phone_number": "+1-555-0101",
        "password": "DoctorPassword123!",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "email": "nurse@clinical-ai.local",
        "username": "nurse.rodriguez",
        "first_name": "Carlos",
        "last_name": "Rodriguez",
        "role": UserRole.NURSE,
        "department": "Intensive Care Unit (ICU)",
        "phone_number": "+1-555-0102",
        "password": "NursePassword123!",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "email": "analyst@clinical-ai.local",
        "username": "analyst.chen",
        "first_name": "Mei",
        "last_name": "Chen",
        "role": UserRole.ANALYST,
        "department": "Clinical Decision Support Research",
        "phone_number": "+1-555-0103",
        "password": "AnalystPassword123!",
        "is_staff": False,
        "is_superuser": False,
    },
]


class Command(BaseCommand):
    help = "Seed initial clinical user roles, groups, and demo accounts."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding clinical groups..."))

        # Create groups
        groups = {}
        for role_choice in UserRole:
            group, created = Group.objects.get_or_create(name=role_choice.value)
            groups[role_choice.value] = group
            if created:
                self.stdout.write(f"  Created group: {role_choice.label} ({role_choice.value})")

        self.stdout.write(self.style.NOTICE("\nSeeding clinical demo users..."))

        created_count = 0
        updated_count = 0

        for user_data in DEMO_USERS:
            email = user_data["email"]
            password = user_data.pop("password")
            role = user_data["role"]

            user, created = User.objects.get_or_create(
                email=email,
                defaults=user_data,
            )

            # Update password and assign group
            user.set_password(password)
            for k, v in user_data.items():
                setattr(user, k, v)
            user.save()

            group = groups.get(role)
            if group:
                user.groups.add(group)

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  [+] Created: {user.full_name} <{user.email}> [{user.role}]"
                    )
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"  [*] Updated: {user.full_name} <{user.email}> [{user.role}]"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSeeding complete: {created_count} created, {updated_count} updated."
            )
        )
