from src.playerFactory import PlayerFactory
from src.roomFactory import RoomFactory
from src.player import Player
from flask_sqlalchemy import SQLAlchemy
import uuid
from db import MapModel
class GameControl(object):
    games = []

    def __init__(self, db):
        self.db = db
    
    def startGame(self, room):
        map = MapModel.query.get(room.map)
        print(map.id)