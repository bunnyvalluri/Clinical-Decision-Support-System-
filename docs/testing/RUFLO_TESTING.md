# Ruflo Testing Strategy & Test Matrix

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Automated Test Suites

The test architecture spans four rigorous layers:

```
[Level 4: End-to-End Workflow Tests] ──> Full Doctor Evaluation -> ML -> Review -> WS
[Level 3: 5-Role Security Matrix]   ──> Patient, Doctor, Nurse, Informaticist, Admin RBAC
[Level 2: Agent Orchestration Tests] ──> Task Queue, State Machine, Timeouts, Loop Defense
[Level 1: Unit Guardrail Tests]      ──> Prompt Injection Scanner, Context Minimization, PSI
```

---

## 2. Test Execution Commands

```bash
# 1. Run Core AI Orchestrator Tests
cd backend && .\venv\Scripts\python.exe -m pytest tests/test_ai_orchestrator.py -v

# 2. Run Ruflo Agent & State Machine Tests
cd backend && .\venv\Scripts\python.exe -m pytest tests/test_ruflo_orchestration.py -v

# 3. Run 5-Role Security Matrix Tests
cd backend && .\venv\Scripts\python.exe -m pytest tests/test_ruflo_role_security.py -v

# 4. Run Realtime Channels WebSocket Tests
cd backend && .\venv\Scripts\python.exe -m pytest tests/test_websockets.py -v

# 5. Frontend TypeScript & Route Verification
cd frontend && npm run type-check
cd frontend && npm run test
```
