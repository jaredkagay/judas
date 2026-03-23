from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.active_rooms = {}
        self.active_votes = {}
        self.meeting_acks = {}

    async def connect(self, websocket: WebSocket, room_code: str, alias: str):
        await websocket.accept()
        if room_code not in self.active_rooms:
            self.active_rooms[room_code] = {}
        self.active_rooms[room_code][alias] = websocket

    def disconnect(self, room_code: str, alias: str):
        if room_code in self.active_rooms and alias in self.active_rooms[room_code]:
            del self.active_rooms[room_code][alias]

    async def broadcast(self, room_code: str, message: dict):
        if room_code in self.active_rooms:
            for connection in self.active_rooms[room_code].values():
                await connection.send_text(json.dumps(message))
                
    async def send_personal_message(self, message: dict, room_code: str, alias: str):
        if room_code in self.active_rooms and alias in self.active_rooms[room_code]:
            websocket = self.active_rooms[room_code][alias]
            await websocket.send_text(json.dumps(message))

manager = ConnectionManager()