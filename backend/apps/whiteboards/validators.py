"""
Excalidraw Document & Element Validators.
Enforces element counts, payload bounds, element structure, and light theme constraints.
"""
from rest_framework.exceptions import ValidationError

MAX_ELEMENTS = 5000
MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_ELEMENT_TYPES = {
    "rectangle",
    "ellipse",
    "diamond",
    "arrow",
    "line",
    "freedraw",
    "text",
    "image",
    "frame",
    "magicframe",
    "embeddable",
}


def validate_excalidraw_document(elements, app_state, files):
    """
    Validates Excalidraw document components.
    Raises ValidationError if invariants or safety caps are violated.
    """
    if not isinstance(elements, list):
        raise ValidationError("Document 'elements' must be a list.")

    if len(elements) > MAX_ELEMENTS:
        raise ValidationError(f"Document exceeds maximum element limit of {MAX_ELEMENTS} (got {len(elements)}).")

    for idx, el in enumerate(elements):
        if not isinstance(el, dict):
            raise ValidationError(f"Element at index {idx} must be a dictionary.")

        el_type = el.get("type")
        if el_type not in ALLOWED_ELEMENT_TYPES:
            raise ValidationError(f"Element at index {idx} has invalid type '{el_type}'.")

        if el_type == "text":
            text_content = el.get("text", "")
            if len(text_content) > 5000:
                raise ValidationError(f"Text element exceeds 5,000 character limit.")

    # Validate & enforce light theme in app_state
    if isinstance(app_state, dict):
        # Healthcare UI Invariant: Force theme to light
        app_state["theme"] = "light"

    return elements, app_state, files
