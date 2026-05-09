import os
import uuid
from fastapi import APIRouter, Depends, HTTPException
from google.cloud import storage as gcs
from models import User
from schemas import UploadUrlRequest, UploadUrlResponse
from auth import get_admin_user

router = APIRouter(prefix="/api/storage", tags=["storage"])

BUCKET_ID = os.getenv("DEFAULT_OBJECT_STORAGE_BUCKET_ID", "")
PRIVATE_DIR = os.getenv("PRIVATE_OBJECT_DIR", "objects/uploads")


@router.post("/upload-url", response_model=UploadUrlResponse)
def request_upload_url(
    body: UploadUrlRequest,
    _: User = Depends(get_admin_user),
):
    if not BUCKET_ID:
        raise HTTPException(status_code=503, detail="오브젝트 스토리지가 설정되지 않았습니다.")

    client = gcs.Client()
    bucket = client.bucket(BUCKET_ID)
    object_id = str(uuid.uuid4())
    blob_name = f"{PRIVATE_DIR}/{object_id}"
    blob = bucket.blob(blob_name)

    upload_url = blob.generate_signed_url(
        version="v4",
        expiration=900,
        method="PUT",
        content_type=body.content_type,
    )
    object_path = f"/objects/{object_id}"
    return UploadUrlResponse(upload_url=upload_url, object_path=object_path)


@router.get("/objects/{object_id}")
def serve_object(object_id: str):
    if not BUCKET_ID:
        raise HTTPException(status_code=503, detail="오브젝트 스토리지가 설정되지 않았습니다.")
    from fastapi.responses import StreamingResponse
    import io

    client = gcs.Client()
    bucket = client.bucket(BUCKET_ID)
    blob_name = f"{PRIVATE_DIR}/{object_id}"
    blob = bucket.blob(blob_name)

    if not blob.exists():
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")

    data = blob.download_as_bytes()
    content_type = blob.content_type or "application/octet-stream"
    return StreamingResponse(io.BytesIO(data), media_type=content_type)
