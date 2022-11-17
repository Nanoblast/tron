from src.playerFactory import PlayerFactory

class GameControl():
    players = []
    rooms = []
    def createPlayer(self, name: str):
        newPlayer = PlayerFactory.createPlayer(name)
        self.players.append(newPlayer)
        return newPlayer

    def getPlayers(self):
        return self.players
