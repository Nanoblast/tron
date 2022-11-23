from src.playerFactory import PlayerFactory
from src.roomFactory import RoomFactory
from src.player import Player
from flask_sqlalchemy import SQLAlchemy
import uuid
class GameControl(object):
    def __init__(self, db):
        self.db = db

    def createPlayer(self, input_name: str):
        from src.model.player_model import PlayerModel
        player = PlayerModel(
            id   = str(uuid.uuid4()),
            name = input_name
        )
        self.db.session.add(player)
        self.db.session.commit()
        return player

    def getPlayers(self):
        return

    def getPlayerByID(id: str):
        #TODO
        return

    def createRoom(self, data):
        master = PlayerFactory.parseJson(data)
        newRoom = RoomFactory.createRoom(master)
        self.rooms.append(newRoom)
        return newRoom
    def getRooms(self):
        return self.rooms

    def joinRoom(self, data):
        player = PlayerFactory.parseJson(data['player'])
        room_id = data['id']
        for room in self.rooms:
            if room.id == room_id:
                return room.joinRoom(player)
        return False

    def leaveRoom(self, data):
        player = PlayerFactory.parseJson(data['player'])
        for room in self.rooms:
            if room.hasPlayer(player):
                room.leaveRoom(player)