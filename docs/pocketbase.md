# PocketBase Integration Guide

## Overview

PocketBase is an open-source Go backend that encapsulates an embedded SQLite database, automatic RESTful JSON APIs, real-time Server-Sent Events (SSE), and an administrative console.

In this Healthcare Clinical Decision Support System (CDSS), **PocketBase is strictly an auxiliary microservice**. It supports non-clinical features such as UI user preferences and system broadcast announcements.

### Key Rules
1. **Neon PostgreSQL is Authoritative**: All clinical data, patient records, vitals, and ML predictions reside in Neon PostgreSQL.
2. **Django is Primary**: Authentication, clinical business logic, and API access are governed by Django REST Framework.
3. **Graceful Degradation**: If PocketBase is down or degraded, the clinical system functions with 100% normal capability.

### Pinned Versions
- **PocketBase Server**: `v0.25.9`
- **PocketBase JS SDK**: `pocketbase@^0.28.1`
- **Go Runtime**: `1.23+`
