from fastapi import FastAPI, WebSocket
from typing import Dict

app = FastAPI()
active_connections: Dict[str, WebSocket] = {}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    active_connections[client_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            target_id, message = data.split(":", 1)
            if target_id in active_connections:
                await active_connections[target_id].send_text(f"{client_id}:{message}")
    except Exception as e:
        print(f"Connection {client_id} closed: {e}")
    finally:
        del active_connections[client_id]
        print(f"Received message from {client_id}: {data}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)