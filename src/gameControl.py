from src.playerFactory import PlayerFactory
from src.roomFactory import RoomFactory
from src.player import Player
class GameControl():
    players = []
    rooms = []
    def createPlayer(self, name: str):
        newPlayer = PlayerFactory.createPlayer(name)
        self.players.append(newPlayer)
        return newPlayer

    def getPlayers(self):
        return self.players
    
    def getPlayerByID(id: str):
        #TODO
        return
    def createRoom(self, data):
        master = PlayerFactory.parseJson(data)
        newRoom = RoomFactory.createRoom(master)
        self.rooms.append(newRoom)
        return newRoom
    def joinRoom(self, room_id, player: Player):
        for room in self.rooms:
            if room.id == room_id:
                return room.joinRoom(player)
