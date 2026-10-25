# Minimal, hardened execution sandbox container for Python code evaluation
FROM python:3.12-slim

# Create non-root unprivileged user and group
RUN groupadd -g 10001 sandboxgroup && \
    useradd -u 10001 -g sandboxgroup -s /sbin/nologin -M sandboxuser

# Set working directory
WORKDIR /workspace

# Install minimal runner script
COPY runner.py /workspace/runner.py

# Set strict permissions: read-only for sandboxuser
RUN chmod 755 /workspace/runner.py && \
    mkdir -p /workspace/tmp && \
    chown -R sandboxuser:sandboxgroup /workspace/tmp && \
    chmod 700 /workspace/tmp

# Drop privileges
USER sandboxuser

# Set environment
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/workspace

# Default command: execute runner
ENTRYPOINT ["python", "/workspace/runner.py"]
