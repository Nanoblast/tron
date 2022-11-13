from player import Player

class Room(object):
    def __init__(self, master: Player):
        self.master = master
        self.players = []
        self.ready = False

    def addPlayer(self, player: Player):
        self.players.append(player)
    
    def getPlayers(self):
        return self.players
    
    def setReady(self):
        self.ready = not self.ready

        