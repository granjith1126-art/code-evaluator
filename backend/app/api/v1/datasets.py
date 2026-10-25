from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import Dataset, DatasetRecord, Submission
from app.schemas.dataset import DatasetCreate, DatasetRead, DatasetExportPreview
from app.schemas.common import PaginatedResponse
from app.exporters.dataset_exporter import dataset_exporter

router = APIRouter()

@router.get("/datasets", response_model=PaginatedResponse)
def list_datasets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Dataset)
    total = query.count()
    items = query.order_by(Dataset.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    summaries = [DatasetRead.model_validate(d) for d in items]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=summaries,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/datasets", response_model=DatasetRead, status_code=status.HTTP_201_CREATED)
def create_dataset(dataset_in: DatasetCreate, db: Session = Depends(get_db)):
    # Find matching submissions based on filters
    query = db.query(Submission)
    filters = dataset_in.filters or {}

    if "min_score" in filters:
        query = query.filter(Submission.total_score >= float(filters["min_score"]))
    if "status" in filters:
        query = query.filter(Submission.status == filters["status"])

    submissions = query.order_by(Submission.id.asc()).limit(500).all()

    dataset = Dataset(
        name=dataset_in.name,
        description=dataset_in.description,
        version=dataset_in.version,
        record_count=len(submissions),
        metadata_json=filters
    )
    db.add(dataset)
    db.flush()

    for sub in submissions:
        rec_json = dataset_exporter.build_record_for_submission(sub, db)
        p_hash = rec_json["provenance_hash"]
        d_record = DatasetRecord(
            dataset_id=dataset.id,
            submission_id=sub.id,
            record_json=rec_json,
            provenance_hash=p_hash
        )
        db.add(d_record)

    db.commit()
    db.refresh(dataset)
    return dataset

@router.get("/datasets/{dataset_id}/preview", response_model=DatasetExportPreview)
def preview_dataset_export(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    records = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset.id).limit(5).all()
    sample_records = [r.record_json for r in records]

    schema_fields = [
        "submission_id", "problem_id", "problem_slug", "problem_title",
        "difficulty", "programming_language", "candidate_solution",
        "deterministic_execution", "ai_evaluation", "human_review", "provenance", "provenance_hash"
    ]

    return DatasetExportPreview(
        dataset_id=dataset.id,
        total_records=dataset.record_count,
        sample_records=sample_records,
        schema_fields=schema_fields,
        format="jsonl"
    )

@router.get("/datasets/{dataset_id}/export")
def export_dataset_file(
    dataset_id: int,
    format: str = Query("jsonl", pattern="^(json|jsonl)$"),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    records = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset.id).all()
    record_dicts = [r.record_json for r in records]

    if format == "json":
        content = dataset_exporter.export_as_json(record_dicts)
        media_type = "application/json"
        filename = f"dataset_{dataset.id}_v{dataset.version}.json"
    else:
        content = dataset_exporter.export_as_jsonl(record_dicts)
        media_type = "application/x-ndjson"
        filename = f"dataset_{dataset.id}_v{dataset.version}.jsonl"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
