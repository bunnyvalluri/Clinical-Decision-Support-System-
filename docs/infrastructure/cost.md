# FinOps & Cost Governance

## Policy & Zero Fake Data Rule
HealthNova AI enforces a strict **Zero Fake Data Policy**:
- We do not synthesize artificial cloud costs or fake CPU/RAM usage.
- If AWS Cost Explorer APIs or CloudWatch billing metrics are unconfigured, systems report `Cost data unavailable`.
- When live credentials are provided in production, real spending breakdowns per service are queried.

## Cost Optimization Strategies
1. **Compute Rightsizing**: `c6i.2xlarge` reserved or savings plans in production; `t3.medium` in dev.
2. **S3 Lifecycle Rules**: Noncurrent backup versions automatically transition to Standard-IA after 30 days and expire after 365 days.
3. **Database Serverless Scaling**: Neon PostgreSQL automatically scales compute according to query traffic.
