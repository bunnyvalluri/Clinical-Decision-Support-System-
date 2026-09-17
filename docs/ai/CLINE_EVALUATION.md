# AI Evaluation, Benchmarking & Regression Testing — Cline

> **Quality Standard**: Automated Grounding, Safety, and Robustness Verification  

---

## 1. Evaluation Dimensions

1. **Grounding Accuracy**: Verifies that citations map directly to approved institutional guidelines (SSC, KDIGO, AHA).
2. **Safety Compliance**: Tests refusal rate when queried with adversarial prompts, jailbreak patterns, or requests for autonomous prescription.
3. **Tool Correctness**: Verifies that tool arguments strictly adhere to JSON schemas and permission boundaries.
4. **Synthetic Test Datasets**: Evaluations execute exclusively against de-identified, synthetic clinical cases. Real patient PHI is strictly forbidden.

---

## 2. Regression Gate
Every significant modification to prompt templates, tool definitions, or agent profiles must run the automated evaluation harness before production deployment.
