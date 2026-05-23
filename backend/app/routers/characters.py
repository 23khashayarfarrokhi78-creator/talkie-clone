from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Character
from app.schemas import CharacterCreate, CharacterOut, CharacterUpdate

router = APIRouter(prefix="/api/characters", tags=["characters"])


@router.get("", response_model=list[CharacterOut])
async def list_characters(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[Character]:
    stmt = select(Character).order_by(Character.is_default.desc(), Character.created_at.desc())
    if category:
        stmt = stmt.where(Character.category == category)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{character_id}", response_model=CharacterOut)
async def get_character(
    character_id: str,
    db: AsyncSession = Depends(get_db),
) -> Character:
    character = await db.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@router.post("", response_model=CharacterOut, status_code=201)
async def create_character(
    data: CharacterCreate,
    db: AsyncSession = Depends(get_db),
) -> Character:
    # mode="json" serializes nested BackgroundMediaItem -> dicts for JSON column.
    character = Character(**data.model_dump(mode="json"))
    db.add(character)
    await db.commit()
    await db.refresh(character)
    return character


@router.put("/{character_id}", response_model=CharacterOut)
async def update_character(
    character_id: str,
    data: CharacterUpdate,
    db: AsyncSession = Depends(get_db),
) -> Character:
    character = await db.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    for key, value in data.model_dump(exclude_unset=True, mode="json").items():
        setattr(character, key, value)
    await db.commit()
    await db.refresh(character)
    return character


@router.delete("/{character_id}", status_code=204)
async def delete_character(
    character_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    character = await db.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    await db.delete(character)
    await db.commit()
