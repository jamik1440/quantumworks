"""
WebSocket Message Handlers
Handle different types of WebSocket messages.
"""
from fastapi import WebSocket
from datetime import datetime
from backend import database, models
from backend.websocket.connection_manager import manager
from backend.websocket.redis_manager import redis_manager

async def handle_chat_message(websocket: WebSocket, sender_id: int, message: dict):
    """Handle incoming chat message."""
    receiver_id = message.get('receiver_id')
    content = message.get('content')
    
    if not receiver_id or not content:
        await websocket.send_json({
            'type': 'error',
            'message': 'Invalid message format'
        })
        return
    
    # Validate content length
    if len(content) > 10000:  # 10KB limit
        await websocket.send_json({
            'type': 'error',
            'message': 'Message too long'
        })
        return
    
    # Validate receiver exists
    db = next(database.get_db())
    try:
        receiver = db.query(models.User).filter(
            models.User.id == receiver_id,
            models.User.is_active == True
        ).first()
        
        if not receiver:
            await websocket.send_json({
                'type': 'error',
                'message': 'Receiver not found'
            })
            return
        
        # Store message in database
        db_message = models.ChatMessage(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content,
            message_type='text',
            created_at=datetime.utcnow()
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        
        # Prepare message for delivery
        message_data = {
            'type': 'chat_message',
            'message_id': db_message.id,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'content': content,
            'timestamp': db_message.created_at.isoformat()
        }
        
        # Publish to Redis for distribution
        await redis_manager.publish(f'user:{receiver_id}', message_data)
        
        # Send confirmation to sender
        await websocket.send_json({
            'type': 'message_sent',
            'message_id': db_message.id
        })
        
    except Exception as e:
        db.rollback()
        print(f"Error handling chat message: {e}")
        await websocket.send_json({
            'type': 'error',
            'message': f'Failed to send message: {str(e)}'
        })
    finally:
        db.close()

async def handle_typing_indicator(websocket: WebSocket, user_id: int, message: dict):
    """Handle typing indicator."""
    receiver_id = message.get('receiver_id')
    is_typing = message.get('is_typing', True)
    
    if receiver_id:
        # Forward typing indicator to receiver
        await manager.send_personal_message({
            'type': 'typing_indicator',
            'sender_id': user_id,
            'is_typing': is_typing
        }, receiver_id)

