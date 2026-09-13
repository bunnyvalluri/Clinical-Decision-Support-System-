# Authorization Architecture

Authorization is enforced at both view and object levels.

---

## 1. Scoped Querysets

Views override `get_queryset()` to prevent unauthorized horizontal escalation:
```python
def get_queryset(self):
    user = self.request.user
    if user.role == UserRole.PATIENT:
        return Patient.objects.filter(user=user)
    elif user.role in [UserRole.CLINICIAN, UserRole.DOCTOR]:
        return Patient.objects.filter(primary_physician=user)
    return Patient.objects.all()
```
