# Bruno License & Dependency Review — HealthNova AI CDSS

> **Product**: Bruno API Client & Test Automation Framework  
> **Source Repository**: https://github.com/usebruno/bruno.git  
> **Selected Version**: `@usebruno/cli@4.1.0`  
> **Primary License**: MIT License

---

## 1. Primary License Analysis

The upstream Bruno codebase (including the CLI engine and core libraries) is distributed under the **MIT License**:

```
MIT License

Copyright (c) 2021-present Anoop M D and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. Dependency License Audit

The Bruno CLI (`@usebruno/cli`) relies on core Node.js runtime libraries. A review of these core dependencies confirms compatibility with enterprise healthcare deployments:

| Dependency / Component | Upstream License | Commercial / Enterprise Use Allowed | Redistribution Obligations |
| :--- | :--- | :--- | :--- |
| **@usebruno/cli** | MIT | Yes | Retain copyright notice |
| **axios / http clients** | MIT | Yes | Retain copyright notice |
| **chai / assertion engines** | MIT | Yes | Retain copyright notice |
| **ajv / schema validator** | MIT | Yes | Retain copyright notice |
| **xml2js / junit formatters** | MIT | Yes | Retain copyright notice |
| **dotenv** | BSD-2-Clause | Yes | Retain BSD copyright notice |
| **commander / cliff** | MIT | Yes | Retain copyright notice |

No copyleft (GPL / AGPL) dependencies are bundled into the Bruno CLI runtime that would impose reciprocal source disclosure requirements on the proprietary HealthNova AI clinical platform.

---

## 3. Compliance and Redistribution Considerations

1. **Development & CI Isolation**: Bruno is utilized solely in developer environments, automated testing containers, and CI/CD pipelines. It is not bundled or distributed to patient or clinician endpoints.
2. **Collection Ownership**: Bruno `.bru` collection files created for HealthNova AI are proprietary works belonging to the HealthNova AI project, governed by repository policy.
3. **Patent / Indemnity Notice**: The software is provided "as is" without warranty. Healthcare software validation must be established independently through clinical verification and deterministic contract tests.
