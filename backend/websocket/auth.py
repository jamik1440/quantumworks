"""
WebSocket Authentication
Validates JWT tokens for WebSocket connections.
"""
from fastapi import WebSocket, status
from jose import jwt
from backend import auth, models, database

async def authenticate_websocket(
    websocket: WebSocket,
    token: str
) -> models.User:
    """Authenticate WebSocket connection using JWT token."""
    
    try:
        # Verify token
        payload = jwt.decode(
            token, 
            auth.SECRET_KEY, 
            algorithms=[auth.ALGORITHM]
        )
        
        # Validate token type
        if payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError("Invalid token type")
        
        email = payload.get("sub")
        if not email:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError("Invalid token")
        
        # Get user from database
        db = next(database.get_db())
        try:
            user = db.query(models.User).filter(
                models.User.email == email
            ).first()
            
            if not user or not user.is_active:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                raise ValueError("User not found or inactive")
            
            return user
        finally:
            db.close()
            
    except jwt.ExpiredSignatureError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise ValueError("Token expired")
    except jwt.JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise ValueError("Invalid token")

