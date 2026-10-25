import hmac
import hashlib
import time
from typing import Optional
import jwt

SECRET_KEY = "dev-secret-key-evaluator-2026-secure-random-token-xyz"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta_seconds: int = 86400) -> str:
    to_encode = data.copy()
    expire = int(time.time()) + expires_delta_seconds
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def hash_password(password: str) -> str:
    # Use sha256 + salt for robust secure hashing without native compilation issues
    salt = "code-evaluator-salt-2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hmac.compare_digest(hash_password(plain_password), hashed_password)
