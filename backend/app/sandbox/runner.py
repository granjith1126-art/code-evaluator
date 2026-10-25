from app.core.config import settings
from app.sandbox.base import BaseSandbox, SandboxExecutionResult
from app.sandbox.docker_sandbox import DockerSandbox
from app.sandbox.subprocess_sandbox import SubprocessSandbox

class SandboxManager:
    def __init__(self):
        self.docker_sandbox = DockerSandbox(image_name=settings.DOCKER_IMAGE_NAME)
        self.subprocess_sandbox = SubprocessSandbox(max_output_bytes=settings.SANDBOX_MAX_OUTPUT_BYTES)

    def get_sandbox(self) -> BaseSandbox:
        mode = settings.SANDBOX_MODE.lower()
        if mode == "docker":
            return self.docker_sandbox
        elif mode == "subprocess":
            return self.subprocess_sandbox
        else:
            # Auto: prefer docker if running, fallback to subprocess
            if self.docker_sandbox.is_available():
                return self.docker_sandbox
            return self.subprocess_sandbox

    def is_docker_available(self) -> bool:
        return self.docker_sandbox.is_available()

sandbox_manager = SandboxManager()
