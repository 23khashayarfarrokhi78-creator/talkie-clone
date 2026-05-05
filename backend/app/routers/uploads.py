import os
import uuid

from fastapi import APIRouter, UploadFile
from fastapi.responses import FileResponse

UPLOAD_DIR = os.path.join(
    "/data" if os.path.isdir("/data") else ".", "uploads"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("")
async def upload_image(file: UploadFile) -> dict[str, str]:
    ext = os.path.splitext(file.filename or "img.png")[1] or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/api/uploads/{filename}"}


@router.get("/{filename}")
async def get_image(filename: str) -> FileResponse:
    filepath = os.path.join(UPLOAD_DIR, filename)
    return FileResponse(filepath)
