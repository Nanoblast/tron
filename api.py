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
#with app.app_context():
#    db.create_all()

@marshal_with(player_resouce_fields)
def serializePlayer(player: PlayerModel):
    return player

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
            return 'Missing name', 404
        input_name = data['name']
        from src.model.player_model import PlayerModel
        player = PlayerModel(
            id   = str(uuid.uuid4()),
            name = input_name
        )
        db.session.add(player)
        db.session.commit()
        return '', 201

    @app.route('/room', methods=['GET'])
    def getRooms():
        result = RoomModel.query.all()
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
            return 'Missing room master.', 404
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
            return 'Missing room information', 404
        if not data['player']:
            return 'Missing player information', 404
        room_id = data['room']['id']
        room = RoomModel.query.get(room_id)
        players = room.players.split(';')
        new_player = PlayerModel.query.get(not data['player']['id'])
        new_player = json.dumps(serializePlayer(new_player))
        #Játékos beléphet még több szobába !!!!!!
        if new_player in players:
            return 'Player already joined!', 402
        players.append(new_player)
        room.players = ";".join(players)
        db.session.add(room)
        db.session.commit()
        return room
        
    @app.route('/room/leave', methods=['POST'])
    def leaveRoom():
        data = request.get_json()
        current_app._control.leaveRoom(data)
        return ''


player_put_args = reqparse.RequestParser()
player_put_args.add_argument("name", type=str, help="Name of player is required", required=True)
player_put_args.add_argument("id", type=int, help="ID of player is required", required=True)

if  __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Time server")
    parser.add_argument('--port', type=int)
    args = parser.parse_args()
    
    app.run(host='127.0.0.1')