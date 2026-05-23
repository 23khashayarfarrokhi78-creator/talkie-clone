from datetime import datetime

from pydantic import BaseModel, model_validator


class BackgroundMediaItem(BaseModel):
    type: str  # "image" or "video"
    url: str
    label: str | None = None


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
    background_media: list[BackgroundMediaItem] = []
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
    background_media: list[BackgroundMediaItem] | None = None
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
    background_media: list[BackgroundMediaItem]
    category: str
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def _compat_background_media(cls, data: object) -> object:
        """Ensure background_media is always a list.

        For rows that were created before the column existed the DB will
        return *None*.  Convert that to an empty list so callers always
        get a consistent shape.
        """
        if hasattr(data, "__dict__"):
            raw = getattr(data, "background_media", None)
            if raw is None:
                object.__setattr__(data, "background_media", [])
        elif isinstance(data, dict):
            if data.get("background_media") is None:
                data["background_media"] = []
        return data


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
