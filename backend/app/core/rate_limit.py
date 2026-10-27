import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    In-memory sliding-window rate limiter middleware:
    Limits burst abuse on expensive evaluation and AI execution endpoints.
    """

    def __init__(self, app, submission_limit_per_min: int = 30, ai_limit_per_min: int = 15):
        super().__init__(app)
        self.submission_limit = submission_limit_per_min
        self.ai_limit = ai_limit_per_min
        self.submission_requests = defaultdict(list)
        self.ai_requests = defaultdict(list)

    def _is_rate_limited(self, request_times: list, limit: int, window: int = 60) -> bool:
        now = time.time()
        # Evict timestamps older than sliding window
        valid_times = [t for t in request_times if now - t < window]
        request_times.clear()
        request_times.extend(valid_times)

        if len(request_times) >= limit:
            return True
        request_times.append(now)
        return False

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path

        # Rate limit POST /api/v1/submissions
        if request.method == "POST" and path.startswith("/api/v1/submissions"):
            if self._is_rate_limited(self.submission_requests[client_ip], self.submission_limit):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Rate limit exceeded: maximum 30 submissions per minute. Please try again shortly."}
                )

        # Rate limit POST /api/v1/evaluations
        if request.method == "POST" and path.startswith("/api/v1/evaluations"):
            if self._is_rate_limited(self.ai_requests[client_ip], self.ai_limit):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Rate limit exceeded: maximum 15 AI evaluations per minute. Please wait before retrying."}
                )

        response = await call_next(request)

        # Append standard security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response
