#!/usr/bin/env bash
set -euo pipefail

TARGET_HOST="${1:-http://localhost:8000}"
echo "==> Verifying Deployment Health at: ${TARGET_HOST}..."

python -c "
import urllib.request
import json
import sys
import time

url = '${TARGET_HOST}/api/v1/health/'
for attempt in range(1, 11):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'HealthNova-CI-Verifier/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                body = json.loads(resp.read().decode('utf-8'))
                status = body.get('status', '')
                if status in ('ok', 'healthy', 'HEALTHY', 'PASS'):
                    print(f'Healthcheck PASSED on attempt {attempt}: {body}')
                    sys.exit(0)
    except Exception as exc:
        print(f'Attempt {attempt}/10: Waiting for service at {url}... ({exc})')
        time.sleep(3)

print('Healthcheck FAILED: Service did not respond with 200 OK within timeout', file=sys.stderr)
sys.exit(1)
"
