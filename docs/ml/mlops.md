# MLOps & Continuous Evaluation

Strategies for maintaining model reliability in production:

1. **Shadow Deployment [PLANNED]:** Running candidate models in parallel with active production models to compare predictions on live clinical encounters.
2. **Data Drift Monitoring:** Tracking vital sign population distributions over time; alerts trigger if Kolmogorov-Smirnov test detects significant divergence from training baselines.
3. **Scheduled Model Evaluation:** Celery Beat job computes periodic accuracy benchmarks against clinician override rates.
