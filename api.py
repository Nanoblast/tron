from flask import Flask, jsonify, request, current_app
from flask_restful import Api, Resource, reqparse, fields, marshal_with
from flask_sqlalchemy import SQLAlchemy
from singleton import Singleton
import argparse
import uuid
import random
import json

app = Flask(__name__)
api = Api(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)
db.init_app(app)

class PlayerModel(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.Integer, nullable=False)

class RoomModel(db.Model):
    id = db.Column(db.String, primary_key=True)
    master = db.Column(db.String, nullable=False)
    players = db.Column(db.String, nullable=False)
    ready = db.Column(db.Boolean, nullable=False)
    passwd = db.Column(db.Integer, nullable=False)

class TileModel(db.Model):
    id = db.Column(db.String, primary_key=True)
    x = db.Column(db.String, nullable=False)
    y = db.Column(db.String, nullable=False)
    occupied = db.Column(db.Boolean, nullable=False)
    player = db.Column(db.String, nullable=True)

class MapModel(db.Model):
    id = db.Column(db.String, primary_key=True)
    tiles = db.Column(db.String, nullable=False)
    
player_resouce_fields = {
    'id': fields.String,
    'name': fields.String
}

room_resourse_fields = {
    'id': fields.String,
    'master': fields.String,
    'players': fields.String,
    'ready': fields.Boolean,
    'passwd': fields.Integer
}

tile_resource_fields = {
    'id': fields.String,
    'x': fields.Integer,
    'y': fields.Integer,
    'occupied': fields.Boolean,
    'player': fields.String
}

map_resource_fields = {
    'id': fields.String,
    'tiles': fields.String
}

@marshal_with(player_resouce_fields)
def serializePlayer(player: PlayerModel):
    return player

@marshal_with(tile_resource_fields)
def serializeTile(tile: TileModel):
    return tile
class API(metaclass=Singleton): 
    @app.route('/player', methods=['GET'])
    @marshal_with(player_resouce_fields)
    def getPlayers():
        result = PlayerModel.query.all()
        return result

    '''
    {
      "name":"jackson"
    }   
    '''
    @app.route('/player/create', methods=['POST'])
    def registerPlayer():
        data = request.get_json()
        if not 'name' in data:
            return 'Missing name', 406
        input_name = data['name']
        from src.model.player_model import PlayerModel
        player = PlayerModel(
            id   = str(uuid.uuid4()),
            name = input_name
        )
        db.session.add(player)
        db.session.commit()
        return '', 201

    @app.route('/rooms', methods=['GET'])
    @marshal_with(room_resourse_fields)
    def getRooms():
        result = RoomModel.query.all()
        return result
    
    '''
    {
        "id": "f2cf0491-0ed5-46ab-bb8d-11c455b9e70f"
    }
    '''
    @app.route('/room', methods=['GET'])
    @marshal_with(room_resourse_fields)
    def getRoom():
        data = request.get_json()
        if not data['id']:
            return 'Missing room ID', 406
        result = RoomModel.query.get(data['id'])
        return result

    '''
    {
        "player":
        {
            "id": "f2cf0491-0ed5-46ab-bb8d-11c455b9e70f",
            "name": "jackson"
        }
    }
    '''
    @app.route('/room/create', methods=['POST'])
    @marshal_with(room_resourse_fields)
    def createRoom():
        data = request.get_json()
        #Room master must be in data
        if not 'player' in data:
            return 'Missing room master.', 406
        player = PlayerModel.query.get(data['player']['id'])
        room = RoomModel(
            id = str(uuid.uuid4()),
            master = player.id,
            players = json.dumps(serializePlayer(player)),
            ready = False,
            passwd = random.randint(1000,9999)
        )
        db.session.add(room)
        db.session.commit()
        return room


    '''
    {
    "room": 
    {
        "id": "b20451f3-631d-4d8a-99bb-c268a06c43dd"
    },
    "player":
    {
        "id": "7740930d-d34a-4085-abfb-275576e142b4",
        "name": "jackson"
        }
    }
    '''
    @app.route('/room/join', methods=['POST'])
    @marshal_with (room_resourse_fields)
    def joinRoom():
        data = request.get_json()
        if not data['room']:
            return 'Missing room information', 406
        if not data['player']:
            return 'Missing player information', 406
        room_id = data['room']['id']
        room = RoomModel.query.get(room_id)
        players = room.players.split(';')
        new_player = PlayerModel.query.get(data['player']['id'])
        new_player = json.dumps(serializePlayer(new_player))
        #Játékos beléphet még több szobába !!!!!!
        if new_player in players:
            return 'Player already joined!', 402
        players.append(new_player)
        room.players = ";".join(players)
        db.session.add(room)
        db.session.commit()
        return room

    '''
    {
        "room": 
        {
            "id": "b20451f3-631d-4d8a-99bb-c268a06c43dd"
        },
        "player":
        {
            "id": "7740930d-d34a-4085-abfb-275576e142b4",
            "name": "jackson"
        }
    }
    '''
    @app.route('/room/leave', methods=['POST'])
    @marshal_with(room_resourse_fields)
    def leaveRoom():
        data = request.get_json()
        if not data['player']:
            return 'Missing player information', 406
        if not data['room']:
            return 'Missing room information', 406
        room_id = data['room']['id']
        room = RoomModel.query.get(room_id)
        players = room.players.split(';')
        leaving_player = PlayerModel.query.get(data['player']['id'])
        leaving_player = json.dumps(serializePlayer(leaving_player))
        if not leaving_player in players:
            return 'Player is not in the room', 406
        players.remove(leaving_player)
        print(players)
        print(leaving_player)
        room.players = ";".join(players)
        db.session.add(room)
        db.session.commit()
        return room
    

    @app.route('/map/create', methods=['GET'])
    @marshal_with(map_resource_fields)
    def createMap():
        tiles = {}
        for i in range(16):
            for j in range(16):
                tiles[str((i+1,j+1))] = serializeTile(TileModel(
                    id = uuid.uuid4(),
                    x = i+1,
                    y = j+1,
                    occupied = False
                ))
        map = MapModel(
            id = uuid.uuid4(),
            tiles = json.dumps((tiles))
        )
        return map

player_put_args = reqparse.RequestParser()
player_put_args.add_argument("name", type=str, help="Name of player is required", required=True)
player_put_args.add_argument("id", type=int, help="ID of player is required", required=True)

if  __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Time server")
    parser.add_argument('--port', type=int)
    args = parser.parse_args()
    
    app.run(host='127.0.0.1', port=args.port)