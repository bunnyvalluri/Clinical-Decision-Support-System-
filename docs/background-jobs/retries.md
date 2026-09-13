# Task Retry Strategy & Idempotency

Tasks inherit from `BaseCDSSAsyncJob` in `config/celery.py`:

1. **Distributed Idempotency Lock:**
   ```python
   lock_key = f"task_lock:report_gen:{report_id}"
   # Acquired in Redis with 300s TTL (nx=True)
   ```
   Prevents duplicate processing if multiple clinicians submit simultaneous compilation requests.
2. **Exponential Backoff with Jitter:**
   - Retries up to 3 times on transient failures (e.g. temporary Redis timeout).
3. **Time Limits:**
   - Soft time limit: 120 seconds (`SoftTimeLimitExceeded`).
   - Hard time limit: 150 seconds.
