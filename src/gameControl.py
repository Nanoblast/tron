from src.playerFactory import PlayerFactory
from src.roomFactory import RoomFactory
from src.player import Player
from flask_sqlalchemy import SQLAlchemy
import uuid
class GameControl(object):
    games = []

    def startGame(self, room):