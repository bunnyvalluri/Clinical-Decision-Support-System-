# Kaggle Dataset Security Architecture

## 1. Threat Vectors in External Data Ingestion
Ingesting third-party tabular datasets introduces multiple software and data security risks:
1. **Zip Slip / Path Traversal**: Malicious archives containing entries such as `../../etc/passwd` designed to overwrite critical host files upon decompression.
2. **Decompression Bombs**: Highly compressed archives (e.g. 42.zip style) that expand to gigabytes or terabytes, exhausting disk or RAM.
3. **CSV Formula Injection (DDE Attacks)**: Cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` that trigger shell execution or remote data exfiltration when opened in spreadsheet software by clinical staff.
4. **Malicious Executable Payloads**: Concealed `.exe`, `.sh`, `.ps1`, `.bat`, or serialized Python `.pkl` / `.joblib` files within archives.

## 2. Deterministic Defensive Countermeasures
- **Archive Entry Inspection**: `KaggleSecurityValidator.validate_archive_safety()` verifies paths before extracting any file. Rejecting any entry containing `..`, absolute paths, or unapproved extensions.
- **Strict Allowlisting of Extensions**: Only `.csv`, `.tsv`, `.parquet`, `.json`, `.txt`, `.md` are permitted. Binary files (`.pkl`, `.bin`, `.h5`) are blocked.
- **Decompression Bounds**: Max archive size 500 MB; max uncompressed size 1 GB; max file count 50.
- **CSV Formula Neutralization**: Cells starting with dangerous prefixes are neutralized by prepending a single quote (`'`), rendering them inert text in spreadsheet software.
- **Quarantine Isolation**: Downloads are staged in a dedicated quarantine directory (`media/kaggle_datasets/quarantine/`) and only moved to `sanitized/` after passing all structural integrity and malware checks.
