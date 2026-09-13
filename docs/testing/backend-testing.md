# Backend Testing with Pytest

The backend test suite is executed using `pytest`.

---

## 1. Execution Commands

```bash
# Run all fast unit and API tests
pytest -q

# Run with verbose output and short tracebacks
pytest -v --tb=short

# Run specific test module
pytest tests/test_predictions.py -v
```

### Pytest Configuration (`pytest.ini`)
Configured with `--reuse-db` to prevent slow table drops between runs, and bytecode tracing disabled by default for sub-second test execution.
