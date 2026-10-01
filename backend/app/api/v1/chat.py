from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.chatbot_service import process_incoming_message
from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["AI Chat"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, current_user: User = Depends(get_current_user)):
    """
    Endpoint for the web-based AI Chat Widget.
    Requires an authenticated user.
    """
    try:
        # We use the user's phone number or ID as the session identifier for the chatbot
        identifier = current_user.phone_number if current_user.phone_number else str(current_user.id)
        
        # Call the existing Gemini chatbot logic
        reply = await process_incoming_message(identifier, request.message)
        
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error generating AI response")
