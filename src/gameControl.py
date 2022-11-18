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
