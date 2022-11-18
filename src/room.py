from src.player import Player

class Room(object):
    def __init__(self, master):
        self.master = master
        self.players = [master]
        self.ready = False
        self.password = 9999

    def addPlayer(self, player: Player):
        self.players.append(player)
    
    def getPlayers(self):
        return self.players
    
    def jsonify(self):
        players = []
        for player in self.players:
            players.append(player.jsonify())
        
        return {
            'master': self.master.jsonify(),
            'pin': self.password,
            'ready': self.ready,
            'players': players
        }

        