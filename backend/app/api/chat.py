from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.llm_service import get_chat_response

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    response: str

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    response = await get_chat_response(request.message, request.language)
    return ChatResponse(response=response)
