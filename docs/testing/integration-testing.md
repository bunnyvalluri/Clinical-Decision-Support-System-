# End-to-End Integration Testing

The integration test [test_e2e_production_flow.py](file:///c:/4-1/backend/tests/test_e2e_production_flow.py) validates the complete 15-step clinical lifecycle in a single automated test:
1. Clinician registration.
2. Login and JWT issuance.
3. Dashboard telemetry query.
4. Patient admission.
5. Clinical vital sign encounter logging.
6. Real-time prediction request.
7. Feature preprocessing.
8. ML inference execution.
9. Risk result classification.
10. SHAP factor attribution extraction.
11. PostgreSQL persistence.
12. Redis event publishing.
13. WebSocket distribution.
14. Prediction audit history query.
15. Celery PDF discharge report compilation and download.
