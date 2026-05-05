from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.database import async_session, engine
from app.models import Base, Character
from app.routers import characters, chat, uploads
from app.seed import DEFAULT_CHARACTERS


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        result = await session.execute(select(Character).where(Character.is_default.is_(True)))
        if not result.scalars().first():
            for char in DEFAULT_CHARACTERS:
                session.add(char)
            await session.commit()

    yield

    await engine.dispose()


app = FastAPI(title="Talkie Clone API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(characters.router)
app.include_router(chat.router)
app.include_router(uploads.router)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
