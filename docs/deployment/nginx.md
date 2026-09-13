# Nginx Reverse Proxy & TLS Configuration

Nginx acts as the primary ingress controller (`docker/nginx/nginx.conf`).

---

## 1. Key Configuration Directives

```nginx
# WebSocket Upgrade Mapping
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# Proxy WebSockets to Daphne
location /ws/ {
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 86400s;
}

# Proxy REST API to Daphne
location /api/ {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```
