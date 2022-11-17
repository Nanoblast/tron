from src.player import Player

class PlayerFactory(object):
    @staticmethod
    def createPlayer(name: str):
        return Player(name)