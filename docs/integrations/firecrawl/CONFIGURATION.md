# Firecrawl Configuration Reference

The following environment variables govern the Firecrawl Web Intelligence integration in `backend/config/settings/base.py`:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `FIRECRAWL_ENABLED` | `bool` | `False` | Master kill switch for all web intelligence features. |
| `FIRECRAWL_MODE` | `str` | `self_hosted` | Deployment mode: `managed` or `self_hosted`. |
| `FIRECRAWL_BASE_URL` | `str` | `http://localhost:3002` | Endpoint URL of Firecrawl API instance. |
| `FIRECRAWL_API_KEY` | `str` | `""` | Bearer authentication key for Firecrawl API. |
| `FIRECRAWL_CONNECT_TIMEOUT` | `int` | `5` | Socket connection timeout in seconds. |
| `FIRECRAWL_REQUEST_TIMEOUT` | `int` | `30` | Request timeout in seconds for synchronous endpoints. |
| `FIRECRAWL_MAX_CONCURRENCY` | `int` | `5` | Maximum concurrent scraping/crawling tasks. |
| `FIRECRAWL_MAX_CRAWL_PAGES` | `int` | `50` | Maximum pages allowed in a single crawl job. |
| `FIRECRAWL_MAX_BATCH_URLS` | `int` | `20` | Maximum URLs permitted per batch scrape request. |
| `FIRECRAWL_MAX_CONTENT_BYTES` | `int` | `5242880` | Maximum content size per scraped page (5 MB). |
| `FIRECRAWL_ALLOWED_DOMAINS` | `list[str]` | `""` | Comma-separated domain allowlist (empty = allow based on DB policy). |
| `FIRECRAWL_BLOCKED_DOMAINS` | `list[str]` | `""` | Comma-separated domain blocklist (immediate rejection). |
| `FIRECRAWL_ALLOW_PUBLIC_WEB_SEARCH` | `bool` | `True` | Permit general medical literature search. |
| `FIRECRAWL_ALLOW_CRAWL` | `bool` | `True` | Permit multi-page site crawling for privileged roles. |
| `FIRECRAWL_ROBOTS_POLICY` | `str` | `respect` | Robots.txt policy enforcement (`respect` or `strict`). |
| `FIRECRAWL_CIRCUIT_FAIL_MAX` | `int` | `5` | Failure threshold before tripping circuit breaker. |
| `FIRECRAWL_CIRCUIT_RESET_SEC` | `int` | `60` | Reset duration for circuit breaker recovery in seconds. |

> [!CAUTION]
> Under no circumstances must `FIRECRAWL_API_KEY` be exposed to the client or prefixed with `NEXT_PUBLIC_`.
