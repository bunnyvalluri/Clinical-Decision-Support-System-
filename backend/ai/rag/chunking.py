"""
Document Chunking Engine for Clinical Knowledge Sources.
Performs semantic hierarchical chunking preserving guideline headers and citations.
"""
import hashlib
import re
from typing import Any, Dict, List


class DocumentChunk:
    def __init__(
        self,
        guideline_id: str,
        chunk_index: int,
        section_header: str,
        text: str,
        token_count: int,
        metadata: Dict[str, Any],
    ):
        self.guideline_id = guideline_id
        self.chunk_index = chunk_index
        self.section_header = section_header
        self.text = text
        self.token_count = token_count
        self.metadata = metadata


class ChunkingEngine:
    """
    Splits clinical guideline documents by markdown sections and token ceilings.
    """

    DEFAULT_MAX_CHUNK_TOKENS = 350
    DEFAULT_CHUNK_OVERLAP_TOKENS = 50

    @classmethod
    def chunk_document(
        cls,
        guideline_id: str,
        document_text: str,
        max_tokens: int = DEFAULT_MAX_CHUNK_TOKENS,
    ) -> List[DocumentChunk]:
        chunks = []
        # Split by markdown headers (# or ## or Section)
        sections = re.split(r"(?m)^(?:#{1,3}\s+|Section\s+\d+:?\s*)", document_text)

        chunk_idx = 0
        for sec in sections:
            clean_sec = sec.strip()
            if not clean_sec:
                continue

            lines = clean_sec.split("\n")
            header = lines[0][:128] if lines else "General"
            content = clean_sec

            words = content.split()
            word_count = len(words)
            est_tokens = int(word_count * 1.3)

            if est_tokens <= max_tokens:
                chunks.append(
                    DocumentChunk(
                        guideline_id=guideline_id,
                        chunk_index=chunk_idx,
                        section_header=header,
                        text=content,
                        token_count=est_tokens,
                        metadata={"section": header, "word_count": word_count},
                    )
                )
                chunk_idx += 1
            else:
                # Sub-chunk with overlap
                step = int(max_tokens / 1.3)
                overlap = int(cls.DEFAULT_CHUNK_OVERLAP_TOKENS / 1.3)
                for i in range(0, word_count, step - overlap):
                    sub_words = words[i : i + step]
                    if not sub_words:
                        continue
                    sub_text = " ".join(sub_words)
                    chunks.append(
                        DocumentChunk(
                            guideline_id=guideline_id,
                            chunk_index=chunk_idx,
                            section_header=f"{header} (part {chunk_idx})",
                            text=sub_text,
                            token_count=int(len(sub_words) * 1.3),
                            metadata={"section": header, "sub_chunk": True},
                        )
                    )
                    chunk_idx += 1

        return chunks

    @classmethod
    def compute_sha256(cls, text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()
