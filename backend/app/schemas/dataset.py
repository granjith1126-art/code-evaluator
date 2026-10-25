from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    version: str = "1.0.0"
    filters: Optional[Dict[str, Any]] = None

class DatasetRecordItem(BaseModel):
    id: int
    dataset_id: int
    submission_id: int
    provenance_hash: str
    record_json: Dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DatasetRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    version: str
    record_count: int
    metadata_json: Dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DatasetExportPreview(BaseModel):
    dataset_id: int
    total_records: int
    sample_records: List[Dict[str, Any]]
    schema_fields: List[str]
    format: str = "jsonl"
