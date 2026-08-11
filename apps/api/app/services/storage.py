import os
from typing import Protocol

import aiofiles  # type: ignore[import-untyped]
from fastapi import UploadFile


class StorageService(Protocol):
    async def upload_file(self, file: UploadFile, directory: str) -> str:
        """Upload a file and return its storage path/identifier."""
        ...

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file by its path/identifier."""
        ...

    async def read_file(self, file_path: str) -> bytes:
        """Read the full contents of a stored file."""
        ...

class LocalStorageService:
    def __init__(self, base_path: str = "./uploads"):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)

    async def upload_file(self, file: UploadFile, directory: str) -> str:
        target_dir = os.path.join(self.base_path, directory)
        os.makedirs(target_dir, exist_ok=True)
        
        if not file.filename:
            raise ValueError("Uploaded file has no filename")
        file_path = os.path.join(target_dir, file.filename)
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
            
        return file_path

    async def delete_file(self, file_path: str) -> bool:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
            return True
        except Exception:
            return False

    async def read_file(self, file_path: str) -> bytes:
        if not os.path.exists(file_path):
            raise FileNotFoundError(file_path)
        async with aiofiles.open(file_path, 'rb') as in_file:
            return await in_file.read()

# Initialize default implementation
storage_service: StorageService = LocalStorageService()
