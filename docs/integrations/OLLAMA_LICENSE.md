# Ollama & Model Licensing Governance

## Core Ollama Engine License
- **Software**: Ollama (https://github.com/ollama/ollama)
- **License**: MIT License
- **Summary**: Permissive commercial use, modification, distribution, and private use, provided copyright notice and license text are retained.

## Approved Local Model Licenses

All models evaluated and registered in `LLMModelRegistry` must undergo legal compliance verification against hospital software governance standards.

| Model Family | License Name | Commercial Use | Clinical Research Use | Redistribution Restrictions |
| :--- | :--- | :--- | :--- | :--- |
| **Meta Llama 3.3** (`llama3.3:8b`, `llama3.3:70b`) | Llama 3.3 Community License Agreement | Permitted (< 700M monthly active users) | Fully Permitted | Meta attribution required; prohibited for illegal medical advice generation. |
| **Qwen 2.5** (`qwen2.5:7b`, `qwen2.5:14b`, `qwen2.5:32b`) | Apache License 2.0 | Permitted | Fully Permitted | Standard Apache 2.0 notice & attribution. |
| **Nomic Embed Text** (`nomic-embed-text:latest`) | Apache License 2.0 | Permitted | Fully Permitted | Fully open weights; standard Apache 2.0 terms. |
| **Mistral AI** (`mistral:7b-instruct-v0.3`) | Apache License 2.0 | Permitted | Fully Permitted | Permissive open source Apache 2.0. |
| **DeepSeek-R1** (`deepseek-r1:8b`, `deepseek-r1:14b`) | MIT License | Permitted | Fully Permitted | Highly permissive open source. |

## Mandatory Clinical Disclaimers & Governance Rules
1. Models deployed within the clinical application are assistive synthesis tools and **NEVER** authorized to provide independent medical diagnosis or prescribe medication.
2. Training or fine-tuning on patient data is prohibited unless de-identified in strict adherence to HIPAA Safe Harbor / Expert Determination standards and approved by the Institutional Review Board (IRB).
3. The license identifier of each model must be recorded in the `LLMModelRegistry` table in Neon PostgreSQL.
