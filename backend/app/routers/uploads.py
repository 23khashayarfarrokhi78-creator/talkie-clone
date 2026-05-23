import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse

UPLOAD_DIR = os.path.join(
    "/data" if os.path.isdir("/data") else ".", "uploads"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# Max upload size: 50 MiB (videos can be larger than images).
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

ALLOWED_IMAGE_PREFIXES = ("image/",)
ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/ogg",
}

EXTENSION_BY_MIME = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/ogg": ".ogv",
}


def _resolve_media_type(content_type: str | None, filename: str | None) -> str | None:
    """Return 'image' or 'video' if accepted, else None."""
    ct = (content_type or "").lower()
    if ct.startswith(ALLOWED_IMAGE_PREFIXES):
        return "image"
    if ct in ALLOWED_VIDEO_TYPES:
        return "video"
    # Fall back to extension sniffing when the browser sends a generic
    # content-type (some Android pickers do this for videos).
    ext = os.path.splitext(filename or "")[1].lower()
    if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".heic"}:
        return "image"
    if ext in {".mp4", ".webm", ".mov", ".ogv", ".m4v"}:
        return "video"
    return None


@router.post("")
async def upload_media(file: UploadFile) -> dict[str, str]:
    media_type = _resolve_media_type(file.content_type, file.filename)
    if media_type is None:
        raise HTTPException(
            status_code=415,
            detail="Unsupported media type. Allowed: image/* and video/mp4, "
            "video/webm, video/quicktime, video/ogg.",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max {MAX_UPLOAD_BYTES // (1024 * 1024)} MiB.",
        )

    ext = os.path.splitext(file.filename or "")[1]
    if not ext:
        ext = EXTENSION_BY_MIME.get(
            (file.content_type or "").lower(),
            ".png" if media_type == "image" else ".mp4",
        )
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/api/uploads/{filename}", "type": media_type}


@router.get("/{filename}")
async def get_media(filename: str) -> FileResponse:
    filepath = os.path.join(UPLOAD_DIR, filename)
    return FileResponse(filepath)
