from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import get_current_user, require_role
from app.database import get_db
from app.models.user import User
from app.services.csv_importer import CSVImporter

router = APIRouter(prefix="/upload", tags=["Data Upload"])


class ImportErrorResponse(BaseModel):
    row: int
    message: str


class UploadResultResponse(BaseModel):
    imported: int
    skipped_duplicates: int
    total_processed: int
    errors: list[ImportErrorResponse]


@router.post("/csv", response_model=UploadResultResponse)
async def upload_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "OPERATOR")),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to decode file. Use UTF-8 encoding.")

    importer = CSVImporter(db)
    result = await importer.import_csv(text, uploaded_by=current_user.id)
    await db.commit()

    return UploadResultResponse(
        imported=result.imported,
        skipped_duplicates=result.skipped_duplicates,
        total_processed=result.total_processed,
        errors=[ImportErrorResponse(row=e.row, message=e.message) for e in result.errors],
    )
