from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=3, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: str = "user"  # 'admin', 'reviewer', 'user'

class UserLogin(BaseModel):
    username: str
    password: str

class UserRead(UserBase):
    id: int
    role: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
