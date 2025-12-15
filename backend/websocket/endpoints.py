"""
WebSocket Endpoints
Main WebSocket endpoint for real-time communication.
"""
from fastapi import WebSocket, WebSocketDisconnect, Query, status
from datetime import datetime
from backend.websocket.connection_manager import manager
from backend.websocket.redis_manager import redis_manager
from backend.websocket.auth import authenticate_websocket
from backend.websocket.handlers import handle_chat_message, handle_typing_indicator
import asyncio

async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """Main WebSocket endpoint for real-time communication."""
    
    try:
        # Authenticate user
        user = await authenticate_websocket(websocket, token)
        user_id = user.id
        
        # Connect to connection manager
        await manager.connect(websocket, user_id)
        
        # Subscribe to user's Redis channels
        async def user_message_handler(channel: str, message: dict):
            """Handle messages from Redis for this user."""
            await manager.send_personal_message(message, user_id)
        
        user_channel = f'user:{user_id}'
        await redis_manager.subscribe(user_channel, user_message_handler)
        
        # Send authentication confirmation
        await websocket.send_json({
            'type': 'authenticated',
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Start heartbeat task
        heartbeat_task = asyncio.create_task(_heartbeat_loop(websocket, user_id))
        
        # Message loop
        try:
            while True:
                data = await websocket.receive_json()
                
                # Handle heartbeat
                if data.get('type') == 'ping':
                    await websocket.send_json({'type': 'pong'})
                    continue
                
                # Handle chat messages
                if data.get('type') == 'chat_message':
                    await handle_chat_message(websocket, user_id, data)
                elif data.get('type') == 'typing':
                    await handle_typing_indicator(websocket, user_id, data)
                
        except WebSocketDisconnect:
            pass
        finally:
            # Cleanup
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass
            
            await manager.disconnect(websocket)
            await redis_manager.unsubscribe(user_channel)
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass

async def _heartbeat_loop(websocket: WebSocket, user_id: int):
    """Send periodic heartbeat to keep connection alive."""
    try:
        while True:
            await asyncio.sleep(30)  # Send every 30 seconds
            try:
                await websocket.send_json({
                    'type': 'heartbeat',
                    'timestamp': datetime.utcnow().isoformat()
                })
            except:
                break  # Connection closed
    except asyncio.CancelledError:
        pass
    except Exception:
        pass

