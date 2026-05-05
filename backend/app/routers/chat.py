from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Character, Conversation, Message
from app.schemas import (
    ChatRequest,
    ChatResponse,
    ConversationOut,
    ConversationWithMessages,
    MessageOut,
)
from app.services.ai_service import generate_response

router = APIRouter(prefix="/api", tags=["chat"])


@router.get("/characters/{character_id}/conversations", response_model=list[ConversationOut])
async def list_conversations(
    character_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[Conversation]:
    stmt = (
        select(Conversation)
        .where(Conversation.character_id == character_id)
        .order_by(Conversation.updated_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
) -> Conversation:
    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages), selectinload(Conversation.character))
        .where(Conversation.id == conversation_id)
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.post("/characters/{character_id}/chat", response_model=ChatResponse)
async def chat(
    character_id: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    character = await db.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    if request.conversation_id:
        conversation = await db.get(Conversation, request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            character_id=character_id,
            title=request.message[:50],
        )
        db.add(conversation)
        await db.flush()

        if character.greeting:
            greeting_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=character.greeting,
            )
            db.add(greeting_msg)
            await db.flush()

    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    await db.flush()

    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    result = await db.execute(stmt)
    history = [{"role": m.role, "content": m.content} for m in result.scalars().all()]

    ai_text = await generate_response(
        character_name=character.name,
        personality=character.personality,
        scenario=character.scenario,
        description=character.description,
        messages=history[:-1],
        user_message=request.message,
    )

    ai_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_text,
    )
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)

    return {
        "message": MessageOut.model_validate(ai_msg),
        "conversation_id": conversation.id,
    }


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    conversation = await db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conversation)
    await db.commit()
