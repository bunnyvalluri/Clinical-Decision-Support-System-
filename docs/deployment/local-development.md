# Local Development with Docker Compose

To run the complete multi-container stack locally:

```bash
# Clone repository and copy environment configuration
cp .env.example .env

# Build and launch containers
docker-compose up --build
```

### Exposed Endpoints
- **Frontend Application:** `http://localhost:3000`
- **Backend REST API:** `http://localhost:8000/api/v1/`
- **Reverse Proxy:** `http://localhost:80`
- **Redis Cache:** `localhost:6379`
