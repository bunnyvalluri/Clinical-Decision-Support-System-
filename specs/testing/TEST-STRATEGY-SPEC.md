# Test Strategy & Quality Gates Specification

**Spec ID**: `TEST-SPEC-001`  
**Domain**: Quality Assurance, Bruno Collections, React Doctor, & Security Validation  
**Status**: `CONVERGED`  

---

## 1. Multi-Tier Test Pyramid

```
                ▲
               / \
              / E2E \       Playwright User Journeys across 5 Portals
             /───────\
            /  API    \     Bruno Collections & Django REST Framework APITestCase
           /───────────\
          / Integration \   Celery Tasks, WebSocket Channels, ML Inference Pipelines
         /───────────────\
        /   Unit Tests    \ Python pytest, Django Models/Services, Jest Component Tests
       ─────────────────────
```

---

## 2. Mandatory Quality Gates

1. **Backend Tests**: `pytest` running across all Django applications with >= 85% code coverage.
2. **API Verification via Bruno**: `python scripts/run_bruno_tests.py` verifying contracts and IDOR prevention.
3. **Frontend Code Quality**: `npx react-doctor` asserting zero critical syntax, hook dependency, or security errors.
4. **Specification Convergence**: `python scripts/converge.py` verifying 100% alignment between specs, code, tests, and constitution.
