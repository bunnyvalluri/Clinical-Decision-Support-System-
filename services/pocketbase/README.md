# PocketBase Auxiliary Service

This directory houses the isolated PocketBase microservice for non-clinical auxiliary features.

## Specifications
- **PocketBase Version**: `v0.25.9` (pinned)
- **Database Engine**: Embedded SQLite
- **Exposed Port**: `8090`
- **Data Volume**: `./pb_data`
- **Migrations Directory**: `./pb_migrations`

## Commands
- Run locally via Docker:
  ```bash
  docker build -t cdss-pocketbase:0.25.9 .
  docker run -p 8090:8090 -v $(pwd)/pb_data:/pb/pb_data cdss-pocketbase:0.25.9
  ```
- Run with docker-compose:
  ```bash
  docker-compose up -d pocketbase
  ```

## Boundary Rules
1. Never import or run clinical queries through PocketBase.
2. Never store patient identifiers or medical records here.
3. For clinical data, use the Django backend at port `8000`.
