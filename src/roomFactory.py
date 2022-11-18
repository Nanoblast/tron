from src.room import Room
from src.player import Player
class RoomFactory():
    @staticmethod
    def createRoom(master):
        return Room(master)

        