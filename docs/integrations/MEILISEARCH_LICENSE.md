# Meilisearch License Review & Redistribution Notice

**Component:** Meilisearch Core Search Engine  
**Evaluated Version:** `v1.12.0`  
**Upstream Repository:** `https://github.com/meilisearch/meilisearch.git`  
**License:** MIT License  
**Compliance Verification Date:** 2026-09-17  
**Project:** BPY-CSE-2666 HealthNova AI Clinical Decision Support System  

---

## 1. Upstream License Text

Meilisearch is distributed under the terms of the **MIT License**:

```
MIT License

Copyright (c) 2018-present Meilisearch

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

## 2. Dependencies & Transitive Licensing Review

Meilisearch is written in Rust and utilizes dependencies managed via Cargo:
- **LMDB (heed wrapper):** OpenLDAP Public License (permissive BSD-style license).
- **Actix-web / Tokio runtime:** MIT / Apache-2.0 dual licenses.
- **Roaring Bitmaps:** Apache-2.0 license.
- **FST (Finite State Transducers):** MIT / Unlicense.

The official Python client (`meilisearch==0.43.0`) is distributed under the **MIT License**.

---

## 3. Redistribution & Compliance Evaluation

1. **Internal Healthcare Usage:** Fully compliant. The MIT License permits internal and production commercial deployment with zero royalties or copyleft reciprocity constraints.
2. **Proprietary Code Invariance:** Using Meilisearch as an auxiliary microservice over HTTP does not create a derivative work or impact the proprietary status of HealthNova AI's clinical machine learning models or patient algorithms.
3. **Attribution:** The copyright notice is preserved in this documentation file and within the system's third-party notices registry.
