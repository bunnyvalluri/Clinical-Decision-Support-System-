"""
Pure-Python, dependency-free script and language detection for Laya multilingual routing.
Derived from NandhaKishorM/laya (Convai Innovations, Apache-2.0).
"""
import unicodedata
from typing import Dict, List, Optional, Tuple

# Unicode blocks for non-Latin scripts (Indic, Asian, Middle Eastern, etc.)
_SCRIPT_RANGES = [
    ("greek", ((0x0370, 0x03FF), (0x1F00, 0x1FFF))),
    ("cyrillic", ((0x0400, 0x052F), (0x2DE0, 0x2DFF), (0xA640, 0xA69F))),
    ("armenian", ((0x0530, 0x058F),)),
    ("hebrew", ((0x0590, 0x05FF),)),
    ("arabic", ((0x0600, 0x06FF), (0x0750, 0x077F), (0x08A0, 0x08FF), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF))),
    ("devanagari", ((0x0900, 0x097F), (0xA8E0, 0xA8FF))),  # Hindi, Marathi, Sanskrit, Nepali
    ("bengali", ((0x0980, 0x09FF),)),                      # Bengali, Assamese
    ("gurmukhi", ((0x0A00, 0x0A7F),)),                     # Punjabi
    ("gujarati", ((0x0A80, 0x0AFF),)),
    ("oriya", ((0x0B00, 0x0B7F),)),
    ("tamil", ((0x0B80, 0x0BFF),)),
    ("telugu", ((0x0C00, 0x0C7F),)),
    ("kannada", ((0x0C80, 0x0CFF),)),
    ("malayalam", ((0x0D00, 0x0D7F),)),
    ("sinhala", ((0x0D80, 0x0DFF),)),
    ("thai", ((0x0E00, 0x0E7F),)),
    ("lao", ((0x0E80, 0x0EFF),)),
    ("tibetan", ((0x0F00, 0x0FFF),)),
    ("myanmar", ((0x1000, 0x109F),)),
    ("georgian", ((0x10A0, 0x10FF),)),
    ("ethiopic", ((0x1200, 0x137F),)),
    ("khmer", ((0x1780, 0x17FF),)),
    ("hangul", ((0x1100, 0x11FF), (0x3130, 0x318F), (0xAC00, 0xD7AF))),
    ("kana", ((0x3040, 0x309F), (0x30A0, 0x30FF), (0x31F0, 0x31FF))),
    ("han", ((0x3400, 0x4DBF), (0x4E00, 0x9FFF), (0xF900, 0xFAFF))),
]

# Language identification mapping for prominent Indic scripts
_SCRIPT_TO_LANG = {
    "devanagari": "hi",  # Hindi / Marathi
    "telugu": "te",      # Telugu
    "tamil": "ta",       # Tamil
    "kannada": "kn",     # Kannada
    "malayalam": "ml",   # Malayalam
    "bengali": "bn",     # Bengali
    "gujarati": "gu",    # Gujarati
    "gurmukhi": "pa",    # Punjabi
    "oriya": "or",       # Odia
}

# English function words
_EN_STOP = {
    "the", "and", "is", "are", "was", "were", "to", "of", "in", "for", "with",
    "that", "this", "it", "you", "have", "has", "not", "but", "on", "at", "be",
    "as", "from", "will", "can", "would", "there", "their", "what", "which",
    "please", "we", "i", "patient", "vital", "triage", "review", "clinical"
}


class LayaLanguageRouter:
    """
    Multilingual script detection and checkpoint routing logic.
    """

    @classmethod
    def detect_script(cls, text: str) -> Tuple[str, float]:
        """
        Detect the dominant non-Latin script in text, or return 'latin'.
        Returns (script_name, fraction_of_characters).
        """
        if not text:
            return "latin", 1.0

        script_counts: Dict[str, int] = {}
        total_letters = 0

        for ch in text:
            if not ch.isalnum():
                continue
            total_letters += 1
            code = ord(ch)
            found = False
            for name, ranges in _SCRIPT_RANGES:
                for start, end in ranges:
                    if start <= code <= end:
                        script_counts[name] = script_counts.get(name, 0) + 1
                        found = True
                        break
                if found:
                    break

        if not total_letters:
            return "latin", 1.0

        if not script_counts:
            return "latin", 1.0

        dominant_script, count = max(script_counts.items(), key=lambda kv: kv[1])
        fraction = count / total_letters
        # Any significant presence of non-Latin script indicates multilingual checkpoint is required
        if fraction >= 0.05 or count >= 3:
            return dominant_script, round(fraction, 4)
        return "latin", 1.0

    @classmethod
    def is_english(cls, text: str) -> bool:
        """
        Check if text is English Latin text.
        """
        script, _ = cls.detect_script(text)
        if script != "latin":
            return False

        words = [w.lower() for w in text.split() if w.isalpha()]
        if not words:
            return True
        hits = sum(1 for w in words if w in _EN_STOP)
        return hits >= 1 or len(words) <= 3

    @classmethod
    def analyse(cls, text: str) -> Dict[str, any]:
        """
        Comprehensive language & script analysis.
        """
        script, script_frac = cls.detect_script(text)
        if script != "latin":
            detected_lang = _SCRIPT_TO_LANG.get(script, "multilingual")
            return {
                "script": script,
                "detected_language": detected_lang,
                "is_english": False,
                "recommended_checkpoint": "convaiinnovations/laya-multilingual",
                "routing_reason": f"Non-Latin script detected ({script}, fraction: {script_frac:.2f})",
            }

        is_en = cls.is_english(text)
        return {
            "script": "latin",
            "detected_language": "en" if is_en else "es/fr/latin-non-en",
            "is_english": is_en,
            "recommended_checkpoint": "convaiinnovations/laya" if is_en else "convaiinnovations/laya-multilingual",
            "routing_reason": "English Latin text" if is_en else "Non-English Latin script text",
        }
