# Bruno Developer Guide — HealthNova AI CDSS

> **Framework**: Bruno API Client & Headless Automation Platform  
> **Version**: `@usebruno/cli@4.1.0`  
> **Collection Root**: `bruno/`

---

## 1. Quick Start

### Installation
The Bruno CLI can be installed globally or run via `npx`:
```bash
# Global installation (pinned)
npm install -g @usebruno/cli@4.1.0

# Verify installation
bru --version
```

### Opening the Collection in Desktop IDE
If using the Bruno Desktop application:
1. Launch Bruno Desktop.
2. Select **Open Collection**.
3. Choose the `bruno/` directory in the root of the repository.
4. Select the **Local** environment from the top-right environment selector.

---

## 2. Running Collections from Terminal

Execute collections headlessly using `bru run`:

```bash
# Run the entire test suite against Local environment
bru run --env Local

# Run a specific domain folder (e.g. Authentication)
bru run auth --env Local

# Run RBAC security tests
bru run security/RBAC --env Local

# Run tests and output JUnit XML report for CI
bru run --env Test --output reports/bruno/junit.xml --format junit

# Run in strict Safe Mode (Default in 3.x+)
bru run --env Test --sandbox=safe
```

---

## 3. Environment Scopes

| Environment File | Host URL | Description | Secret Policy |
| :--- | :--- | :--- | :--- |
| `environments/Local.bru` | `http://localhost:8000` | Local developer instance | Safe local placeholders |
| `environments/Development.bru` | `https://dev-api.healthnova.local` | Shared development cluster | Injected via env vars |
| `environments/Test.bru` | `http://127.0.0.1:8000` | Automated CI pipeline runner | Ephemeral synthetic tokens |
| `environments/Staging.bru` | `https://staging-api.healthnova.local` | Pre-production validation | Secure secret manager |
| `environments/Production.bru` | `https://api.healthnova.ai` | Production health & read-only | **Read-only only. Zero secrets committed.** |

---

## 4. Scripting & Assertions Guide

Bruno collections use JavaScript for assertions and dynamic environment management. All scripts must respect Safe Mode restrictions:

```bru
meta {
  name: PATIENT-READ-001
  type: http
  seq: 1
}

get {
  url: {{base_url}}/api/v1/patients/{{test_patient_id}}/
  auth: bearer
}

headers {
  Accept: application/json
}

auth:bearer {
  token: {{doctor_access_token}}
}

assert {
  res.status: eq 200
  res.body.id: eq {{test_patient_id}}
  res.body.mrn: isDefined
  res.body.first_name: isDefined
  res.body.last_name: isDefined
}
```
