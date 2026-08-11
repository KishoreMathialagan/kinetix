import os
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/kinetix_test"

import app.database.session as session_module
from app.database.base import Base
from main import app


@pytest_asyncio.fixture(scope="function")
async def setup_test_db() -> AsyncGenerator[None, None]:
    """Setup and teardown the test database tables.

    A fresh engine is created inside this test's event loop (using a
    NullPool so no pooled connections linger across event loops, which
    breaks on Windows with the proactor event loop).
    """
    engine = create_async_engine(
        os.environ["DATABASE_URL"], pool_pre_ping=True, poolclass=NullPool
    )
    session_module.engine = engine
    session_module.async_session_maker = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from scripts.seed import seed_roles_and_permissions
    await seed_roles_and_permissions()

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()

@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Fixture to provide an async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
