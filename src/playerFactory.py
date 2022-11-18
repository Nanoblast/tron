from src.player import Player

class PlayerFactory(object):
    @staticmethod
    def createPlayer(name: str):
        return Player(name)
    
    def parseJson(data: str):
        player = Player(data['name'])
        player.id = data['id']
        return player