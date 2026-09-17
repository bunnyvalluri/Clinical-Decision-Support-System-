# Coolify License & Redistribution Review — HealthNova AI CDSS

> **Product**: Coolify Self-Hosted Platform  
> **Source Repository**: https://github.com/coollabsio/coolify.git  
> **Pinned Version**: `v4.0.0-beta.380`  
> **Primary License**: Apache License 2.0

---

## 1. Upstream License Analysis

The official Coolify source code is distributed under the **Apache License, Version 2.0**:

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.
      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      patent license to make, have made, use, offer to sell, sell, import,
      and otherwise transfer the Work...
```

---

## 2. Dependency License Audit

Coolify utilizes containerized services and standard open-source tools:

| Component | Upstream License | Enterprise / Commercial Usability | Redistribution Requirements |
| :--- | :--- | :--- | :--- |
| **Coolify Core** | Apache 2.0 | Approved | Retain copyright & license notices |
| **Traefik Proxy** | MIT | Approved | Retain MIT copyright notice |
| **Docker Engine API**| Apache 2.0 | Approved | Retain Apache 2.0 notice |
| **Redis Server** | BSD-3-Clause | Approved | Retain BSD copyright notice |
| **PostgreSQL** | PostgreSQL (MIT-style) | Approved | Retain PostgreSQL notice |

---

## 3. Compliance and Healthcare Considerations

1. **Self-Hosted Infrastructure Boundary**: Coolify runs on the organization's dedicated cloud or on-premise compute instances. No patient data or proprietary code is transmitted to external telemetry servers.
2. **Proprietary Source Isolation**: The HealthNova AI CDSS application code (Django, Next.js, ML models) is orchestrated by Coolify via standard Git webhooks and Docker builds; it is not combined or statically linked with Coolify source code, ensuring zero licensing contamination.
3. **Trademark Notice**: "Coolify" and "Coollabs" trademarks are owned by their respective holders and used purely for descriptive architectural integration purposes.
