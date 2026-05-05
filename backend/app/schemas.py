from datetime import datetime

from pydantic import BaseModel


class CharacterCreate(BaseModel):
    name: str
    tagline: str = ""
    description: str = ""
    personality: str = ""
    scenario: str = ""
    greeting: str = ""
    avatar_url: str = ""
    avatar_color: str = "#6366f1"
    background_url: str = ""
    category: str = "custom"


class CharacterUpdate(BaseModel):
    name: str | None = None
    tagline: str | None = None
    description: str | None = None
    personality: str | None = None
    scenario: str | None = None
    greeting: str | None = None
    avatar_url: str | None = None
    avatar_color: str | None = None
    background_url: str | None = None
    category: str | None = None


class CharacterOut(BaseModel):
    id: str
    name: str
    tagline: str
    description: str
    personality: str
    scenario: str
    greeting: str
    avatar_url: str
    avatar_color: str
    background_url: str
    category: str
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: str
    character_id: str
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationWithMessages(ConversationOut):
    messages: list[MessageOut] = []
    character: CharacterOut | None = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    message: MessageOut
    conversation_id: str
