# NocoDB Architectural Analysis & Integration Strategy

> **Source Repository:** `https://github.com/nocodb/nocodb.git`  
> **Platform Target:** HealthNova AI (BPY-CSE-2666) Clinical Decision Support System  
> **Authoritative Database:** Neon PostgreSQL (Sole Source of Truth)  
> **Role:** Controlled Data Workspace & Internal Informatics Platform  

---

## 1. Repository Structure & Core Modules

NocoDB is an open-source, no-code relational database spreadsheet platform. The repository is structured as a TypeScript/JavaScript monorepo:

- **`packages/nocodb/`**: Core server backend built with Node.js and NestJS-style architectural patterns. Contains database metadata handlers, schema synchronizers, REST/Meta APIs, formula engines, and authentication adapters.
- **`packages/nc-gui/`**: Frontend single-page application built with Vue 3 / Nuxt 3 and Tailwind CSS. Provides grid, form, gallery, kanban, and calendar visualization views.
- **`packages/nc-sdk/`**: Client SDK for programmatic access to bases, tables, views, and rows.
- **`packages/nocodb-sdk/`**: Lightweight typed API wrapper.
- **Database Abstraction Layer**: Utilizes Knex.js and internal query builders supporting PostgreSQL, MySQL, SQLite, and SQL Server.

---

## 2. Selected Version & Release Baseline

- **Selected Release**: `nocodb/nocodb:0.258.0` (Docker official container image) / `v0.258.x` stable branch.
- **Runtime Environment**: Node.js 20 LTS inside alpine container.
- **Deployment Topology**: Dedicated microservice deployed alongside Django, Redis, and Celery, accessible via internal Docker bridge network (`http://nocodb:8080`).

---

## 3. Core Architectural Mechanisms

### 3.1 Metadata vs. Source Separation
NocoDB manages its own internal metadata schema prefixed with `nc_` (e.g., `nc_bases`, `nc_models`, `nc_col_props`, `nc_views`, `nc_users`).
In this healthcare integration:
- **Neon PostgreSQL is the sole authoritative clinical database.**
- NocoDB metadata tables are isolated in a dedicated schema (`nocodb_meta`) or dedicated SQLite volume, strictly preventing NocoDB metadata tables from colliding with or contaminating clinical domain tables.

### 3.2 View Types & Utility
- **Grid View**: Primary spreadsheet interface used by Medical Informaticists for data quality audit and ML monitoring.
- **Kanban View**: Operational clinical task queues, data remediation workflows, and triage status tracking.
- **Form View**: Standardized data collection for non-clinical administrative feedback and IT asset tracking.
- **Calendar View**: Model retrain schedules and clinical audit milestone tracking.

---

## 4. MCP (Model Context Protocol) Capabilities

Modern NocoDB releases incorporate MCP server endpoints allowing LLMs and AI agents to query metadata and table records.
In **HealthNova AI**, direct unrestricted MCP access to Neon PostgreSQL is strictly forbidden. Instead:
- All MCP interactions route through the **Django NocoDB MCP Gateway**.
- The gateway enforces role allowlists, column redaction (stripping PHI), rate limits, and mandatory **READ-ONLY** defaults.

---

## 5. Limitations & Healthcare Safeguards

1. **No Autonomous Clinical Mutations**: NocoDB formulas and automations are non-authoritative. They cannot issue diagnoses, calculate medical risk scores, or prescribe treatments.
2. **Formula Sandboxing**: NocoDB formula columns are restricted to operational display metrics; clinical ML risk probabilities remain strictly computed by the Django ML Engine.
3. **No Direct External DB Connections**: SSRF and network controls prohibit arbitrary users from connecting external database instances.
