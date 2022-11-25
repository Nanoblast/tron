from flask import Flask, jsonify, request, current_app
from flask_restful import Api, Resource, reqparse, fields, marshal_with
from flask_sqlalchemy import SQLAlchemy
from singleton import Singleton
import argparse
import uuid
import random
import json
from flask_cors import CORS, cross_origin
from src.gameControl import GameControl

app = Flask(__name__)
api = Api(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)
db.init_app(app)
CORS(app)
control = GameControl()


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

'''map_resource_fields = {
    'id': fields.String,
    'tiles': fields.List(fields.Nested(api.model({
        'id': fields.String,
        'x': fields.Integer,
        'y': fields.Integer,
        'occupied': fields.Boolean,
        'player': fields.String 
    })))
}'''

@marshal_with(player_resouce_fields)
def serializePlayer(player: PlayerModel):
    return player

@marshal_with(tile_resource_fields)
def serializeTile(tile: TileModel):
    return tile

@marshal_with(map_resource_fields)
def serializeMap(map: MapModel):
    return map

@marshal_with(room_resourse_fields)
def serializeRoom(room: RoomModel):
    return room

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
        player = PlayerModel(
            id   = str(uuid.uuid4()),
            name = input_name
        )
        db.session.add(player)
        db.session.commit()
        return serializePlayer(player), 201

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

    def getRoom():
        data = request.get_json()
        if not data['id']:
            return 'Missing room ID', 406
        room = RoomModel.query.get(data['id'])
        response = serializeRoom(room)
        response['players'] = json.loads(room.players)
        return response

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
    def createRoom():
        data = request.get_json()
        #Room master must be in data
        if not 'player' in data:
            return 'Missing room master.', 406
        player = PlayerModel.query.get(data['player']['id'])
        room = RoomModel(
            id = str(uuid.uuid4()),
            master = player.id,
            players = json.dumps([serializePlayer(player)]),
            ready = False,
            passwd = random.randint(1000,9999)
        )
        db.session.add(room)
        db.session.commit()
        response = serializeRoom(room)
        response['players'] = json.loads(room.players)
        return response


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
    def joinRoom():
        data = request.get_json()
        if not data['room']:
            return 'Missing room information', 406
        if not data['player']:
            return 'Missing player information', 406
        room_id = data['room']['id']
        room = RoomModel.query.get(room_id)
        if not room:
            return 'Invalid information', 406
        players = json.loads(room.players)
        new_player = PlayerModel.query.get(data['player']['id'])
        new_player = serializePlayer(new_player)
        #Játékos beléphet még több szobába !!!!!!
        if new_player in players:
            return 'Player already joined!', 406
        players.append(new_player)
        print(players)
        room.players = json.dumps(players)
        db.session.add(room)
        db.session.commit()
        response = serializeRoom(room)
        response['players'] = json.loads(room.players) 
        return response

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
    def leaveRoom():
        data = request.get_json()
        if not data['player']:
            return 'Missing player information', 406
        if not data['room']:
            return 'Missing room information', 406
        room_id = data['room']['id']
        room = RoomModel.query.get(room_id)
        players = json.loads(room.players)
        leaving_player = PlayerModel.query.get(data['player']['id'])
        leaving_player = serializePlayer(leaving_player)
        if not leaving_player in players:
            return 'Player is not in the room', 406
        players.remove(leaving_player)
        print(players)
        print(leaving_player)
        room.players = json.dumps(players)
        db.session.add(room)
        db.session.commit()
        response = serializeRoom(room)
        response['players'] = json.loads(room.players) 
        return response
    

    @app.route('/map/create', methods=['GET'])
    #@marshal_with(map_resource_fields)
    def createMap():
        tiles = []
        for i in range(16):
            for j in range(16):
                tiles.append(serializeTile(TileModel(
                    id = str(uuid.uuid4()),
                    x = i+1,
                    y = j+1,
                    occupied = False
                )))
        map = MapModel(
            id = str(uuid.uuid4()),
            tiles = (json.dumps(tiles))
        )
        db.session.add(map)
        db.session.commit()
        response = {
            'id': map.id,
            'tiles': tiles
        }
        return response

    @app.route('/game/start', methods=['POST'])
    def startGame():
        data = request.get_json()
        if not data['room']:
            return 'Missing room information'
        if not data['room']['id']:
            return 'Missing room ID'
        room = RoomModel.query.get(data['room']['id'])
        if not room:
            return 'Invalid room', 406
        control.startGame(room)



player_put_args = reqparse.RequestParser()
player_put_args.add_argument("name", type=str, help="Name of player is required", required=True)
player_put_args.add_argument("id", type=int, help="ID of player is required", required=True)

if  __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Time server")
    parser.add_argument('--port', type=int)
    args = parser.parse_args()
    
    app.run(host='127.0.0.1', port=args.port)