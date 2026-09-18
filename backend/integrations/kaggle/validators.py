"""
Security and file integrity validators for untrusted Kaggle dataset downloads.
Guards against:
- Zip slip / path traversal vulnerabilities
- Decompression bombs (oversized archives)
- CSV formula injection (DDE attacks)
- Malicious file formats (rejects executables, macros, binary pickles)
"""
import csv
import io
import logging
import os
from pathlib import Path
import re
from typing import List, Set, Tuple
import zipfile

from integrations.kaggle.exceptions import KaggleSecurityError

logger = logging.getLogger("integrations.kaggle.validators")

# Limits
MAX_ARCHIVE_SIZE_BYTES = 500 * 1024 * 1024       # 500 MB max zip
MAX_TOTAL_UNCOMPRESSED_BYTES = 1024 * 1024 * 1024 # 1 GB max extracted
MAX_FILE_COUNT = 50                              # Max files per dataset
MAX_SINGLE_FILE_BYTES = 300 * 1024 * 1024        # 300 MB single file

ALLOWED_EXTENSIONS: Set[str] = {".csv", ".tsv", ".parquet", ".json", ".txt", ".md"}
DANGEROUS_EXTENSIONS: Set[str] = {
    ".exe", ".sh", ".bat", ".cmd", ".vbs", ".ps1", ".py", ".pyc", ".pyd",
    ".dll", ".so", ".dylib", ".pkl", ".pickle", ".joblib", ".bin", ".h5", ".pth"
}

# Formula prefixes commonly exploited in spreadsheet DDE injection
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


class KaggleSecurityValidator:
    """Security validation engine for downloaded Kaggle artifacts."""

    @classmethod
    def validate_archive_safety(cls, zip_path: Path) -> List[zipfile.ZipInfo]:
        """
        Inspect zip archive before extraction to prevent zip slips and decompression bombs.
        """
        if not zip_path.is_file():
            raise KaggleSecurityError(f"Target archive does not exist: {zip_path}")

        archive_size = zip_path.stat().st_size
        if archive_size > MAX_ARCHIVE_SIZE_BYTES:
            raise KaggleSecurityError(
                f"Archive size ({archive_size} bytes) exceeds safety limit of {MAX_ARCHIVE_SIZE_BYTES} bytes."
            )

        total_uncompressed = 0
        file_count = 0
        safe_members: List[zipfile.ZipInfo] = []

        try:
            with zipfile.ZipFile(zip_path, "r") as zf:
                infos = zf.infolist()
                for info in infos:
                    # Ignore directories
                    if info.is_dir():
                        continue

                    file_count += 1
                    if file_count > MAX_FILE_COUNT:
                        raise KaggleSecurityError(f"Archive exceeds maximum permitted file count ({MAX_FILE_COUNT}).")

                    filename = info.filename
                    # Path traversal check (zip slip)
                    if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
                        raise KaggleSecurityError(f"Potential path traversal detected in archive entry: {filename}")

                    norm_path = os.path.normpath(filename)
                    if norm_path.startswith("..") or os.path.isabs(norm_path):
                        raise KaggleSecurityError(f"Illegal relative path in archive entry: {filename}")

                    ext = Path(filename).suffix.lower()
                    if ext in DANGEROUS_EXTENSIONS:
                        raise KaggleSecurityError(f"Prohibited executable/binary file found in dataset archive: {filename}")

                    if ext not in ALLOWED_EXTENSIONS:
                        logger.warning("Skipping non-tabular file format in archive: %s", filename)
                        continue

                    if info.file_size > MAX_SINGLE_FILE_BYTES:
                        raise KaggleSecurityError(f"Extracted file {filename} exceeds limit of {MAX_SINGLE_FILE_BYTES} bytes.")

                    total_uncompressed += info.file_size
                    if total_uncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES:
                        raise KaggleSecurityError("Decompression bomb protection triggered: uncompressed data exceeds limit.")

                    safe_members.append(info)

        except zipfile.BadZipFile as exc:
            raise KaggleSecurityError(f"Invalid or corrupted zip archive: {exc}")

        return safe_members

    @classmethod
    def sanitize_csv_cell(cls, value: str) -> str:
        """
        Neutralize CSV formula injection by prefixing risky strings with a single quote.
        """
        if not isinstance(value, str):
            return value
        if value and value.startswith(FORMULA_PREFIXES):
            # Escaping with a single quote is standard RFC/OWASP practice for spreadsheet injection
            return "'" + value
        return value

    @classmethod
    def sanitize_csv_file(cls, input_path: Path, output_path: Path) -> int:
        """
        Read raw untrusted CSV, sanitize formula injection, and write to secure sanitized destination.
        Returns the sanitized row count.
        """
        rows_processed = 0
        with open(input_path, "r", encoding="utf-8", errors="replace") as fin, \
             open(output_path, "w", encoding="utf-8", newline="") as fout:
            reader = csv.reader(fin)
            writer = csv.writer(fout)
            for row in reader:
                sanitized_row = [cls.sanitize_csv_cell(cell) for cell in row]
                writer.writerow(sanitized_row)
                rows_processed += 1

        return rows_processed
