# Test Plan & Verification: Patient Risk Level Prediction

**Feature ID**: `FEAT-PRED-001`  
**Status**: `CONVERGED`  

---

## 1. Automated Test Suite

| Test Suite | File Location | Target Invariant | Result |
| :--- | :--- | :--- | :--- |
| **Unit / Service Tests** | `backend/apps/predictions/tests/test_services.py` | Model evaluation, calibration, TreeSHAP formatting | `PASS` |
| **Safety Override Tests**| `backend/apps/predictions/tests/test_qsofa_override.py`| qSOFA $\ge 2$ overrides ML score to HIGH | `PASS` |
| **IDOR Security Tests** | `backend/apps/predictions/tests/test_permissions.py` | Cross-patient prediction access returns HTTP 403 | `PASS` |
| **Bruno API Collection** | `bruno/predictions/evaluate_risk.bru` | Request/response schema and metadata validation | `PASS` |
| **Frontend Quality** | `frontend/src/components/predictions/` | React Doctor syntax, hook rules, white-only styles | `PASS` |

---

## 2. Verification Execution Commands
```bash
# Run Django backend prediction test suite
pytest backend/apps/predictions/tests/

# Run Bruno automated API test collection
python scripts/run_bruno_tests.py --collection bruno/predictions/

# Run React Doctor frontend analysis
npx react-doctor frontend/src/components/predictions/
```
