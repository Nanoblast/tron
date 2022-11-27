from flask import Flask, jsonify, request, current_app
from flask_restful import Api, Resource, reqparse, fields, marshal_with
from flask_sqlalchemy import SQLAlchemy
from singleton import Singleton
import argparse
import uuid
import random
import json
from flask_cors import CORS, cross_origin

app = Flask(__name__)
api = Api(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)
db.init_app(app)
CORS(app)

class PlayerModel(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.Integer, nullable=False)
    ready = db.Column(db.Boolean, nullable=False)

class RoomModel(db.Model):
    id = db.Column(db.String, primary_key=True)
    master = db.Column(db.String, nullable=False)
    players = db.Column(db.String, nullable=False)
    ready = db.Column(db.Boolean, nullable=False)
    passwd = db.Column(db.Integer, nullable=False)
    map = db.Column(db.String, nullable=True)

class TileModel(db.Model):
    id = db.Column(db.String, primary_key=True)
    x = db.Column(db.Integer, nullable=False)
    y = db.Column(db.Integer, nullable=False)
    occupied = db.Column(db.Boolean, nullable=False)
    player = db.Column(db.String, nullable=True)

class MapModel(db.Model):
    id = db.Column(db.String, primary_key=True)
    tiles = db.Column(db.String, nullable=False)

class GameControl(metaclass=Singleton):
    games = []
    def __init__(self):
        self.db = db
    
    def startGame(self, room):
        from maps import BasicMap
        game = {
            "turn": 1,
            "current_player": json.loads(room.players)[0]['id'],
            "players": json.loads(room.players),
            "map": [],
            "history": {}
        }
        map = MapModel.query.get(room.map)
        tiles = json.loads(map.tiles)
        for t in tiles:
            if t['x'] == 1 and t['y'] == 1 : 
                t['player'] = game['players'][0]['id']
                game['history'][t['player']] = [{"x": t['x'], "y":t["y"]}]
            if t['x'] == 1 and t['y'] == 4 : 
                t['player'] = game['players'][1]['id']
                game['history'][t['player']] = [{"x": t['x'], "y":4}]
            if t['x'] == 16 and t['y'] == 1 and len(game['players']) > 2:
                t['player'] = game['players'][2]['id'] 
                game['history'][t['player']] = [{"x": t['x'], "y":t["y"]}]
            if t['x'] == 16 and t['y'] == 16 and len(game['players']) > 3: 
                t['player']= game['players'][3]['id']
                game['history'][t['player']] = [{"x": t['x'], "y":t["y"]}]
        game['map'] = tiles
        self.games.append(game)
        return game

    def getState(self, player_id):
        player = serializePlayer(PlayerModel.query.get(player_id))
        game = self.findGameByPlayer(player)
        return game
        
    def findGameByPlayer(self, player):
        for g in self.games:
            if player in g['players']:
                return g
        return False

    def step(self, data):
        player = serializePlayer(PlayerModel.query.get(
            data['player']['id'])
            )
        game = self.findGameByPlayer(player)
        if not game: return
        steps = data['steps']

        if game['history'][player['id']][-1]['x'] != steps[0]['x'] or game['history'][player['id']][-1]['y'] != steps[0]['y']:
            return False
        if game['current_player'] != player['id']:
            print(game['current_player'], player['id'])
            return False
        for i in range(len(steps)-1):
            valid = self.validateStep(game, steps[i], steps[i+1])
            if not valid: 
                print('invalid')
                return False
            
            game['history'][player['id']].append(steps[i+1])

            death = self.updateXY(steps[i], steps[i+1], game, player)
            if death: break
            print(game['history'])
        game['current_player'] = self.getNextPlayer(game)
        return game['current_player']

    def getNextPlayer(self, game):
        
        turn_index = game['turn'] % (len(game['players']))
        game['turn'] += 1
        return game['players'][turn_index]['id']

    def updateXY(self, _from, _to, game, player):
        for i in range(len(game['map'])):
            if game['map'][i]['x'] == _from['x'] and game['map'][i]['y'] == _from['y']:
                game['map'][i]['occupied'] = True
            if game['map'][i]['x'] == _to['x'] and game['map'][i]['y'] == _to['y']:
                if str(game['map'][i]['player']) != "None":
                    self.killPlayer(player, game)
                    return True
                else:
                    game['map'][i]['player'] = player['id']
                return False
        return True
    def killPlayer(self, player, game ):
        print("kill")
        for tile in game['map']:
            if tile['player'] == player['id']:
                tile['player'] = None
                tile['occupied'] = False
        for i in range(len(game['players'])):
            print('xxx',i, len(game['players']))
            if game['players'][i]['id'] == player['id']:
                del game['players'][i]
                print(game)
                break
        game['history'].pop(player['id'])
        print(game['players'])
    def validateStep(self, game, _from, _to):
        #ezért a pokolban fogok elégni
        if (abs(int(_from['x']) - int(_to['x'])) >= 0 and abs(int(_from['x']) - int(_to['x'])) <= 1) and (abs(int(_from['y']) - int(_to['y'])) >= 0 and abs(int(_from['y']) - int(_to['y'])) <= 1 and (abs(int(_from['x']) - int(_to['x'])) + abs(int(_from['y']) - int(_to['y'])) == 1)) :
            return True
        return False

        #Validating the passed ID with the current players ID

    def loadTile(self, id):
        return TileModel.query.get(id)
        

        
player_resouce_fields = {
    'id': fields.String,
    'name': fields.String,
    'ready': fields.Boolean
}

room_resourse_fields = {
    'id': fields.String,
    'master': fields.String,
    'players': fields.String,
    'ready': fields.Boolean,
    'passwd': fields.Integer,
    #Foreing key
    'map': fields.String
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
control = GameControl()

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
    @app.route('/player/ready', methods=['POST'])
    def setReady():
        data = request.get_json()
        if not 'id' in data:
            return 'missing ID', 406
        player = PlayerModel.query.get(data['id'])
        rooms = RoomModel.query.all()
        for room in rooms:
            if json.dumps(serializePlayer(player)) in room.players:
                data = []
                for p in json.loads(room.players):
                    if p['id'] == player.id:
                        p['ready'] = True
                    data.append(p)
                room.players = json.dumps(data)
        player.ready = True
        db.session.add(player)
        db.session.add(room)
        db.session.commit()
        return serializePlayer(player), 201
    
    @app.route('/player/create', methods=['POST'])
    def createPlayer():
        data = request.get_json()
        if not 'name' in data:
            return 'Missing name', 406
        input_name = data['name']
        player = PlayerModel(
            id   = str(uuid.uuid4()),
            name = input_name,
            ready = False
        )
        db.session.add(player)
        db.session.commit()
        return serializePlayer(player), 201

    @app.route('/player', methods=['GET'])
    def getPlayer():
        id = request.args.get('id')
        if not id:
            return 'Missing ID', 406
        player = PlayerModel.query.get(id)
        return serializePlayer(player), 201

    @app.route('/rooms', methods=['GET'])
    #@marshal_with(room_resourse_fields)
    def getRooms():
        rooms = RoomModel.query.all()
        response = []
        for room in rooms:
            line = serializeRoom(room)
            line['players'] = json.loads(room.players)
            response.append(line)
        return response
    
    '''
    {
        "id": "f2cf0491-0ed5-46ab-bb8d-11c455b9e70f"
    }
    '''
    @app.route('/room', methods=['GET'])
    def getRoom():
        id = request.args.get('id')
        if not id:
            return 'Missing room ID', 406
        room = RoomModel.query.get(id)
        if not room:
            return 'Invalid information'
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

        tiles = []
        for i in range(16):
            for j in range(16):
                tile = TileModel(
                    id = str(uuid.uuid4()),
                    x = i+1,
                    y = j+1,
                    occupied = False
                )
                db.session.add(tile)
                tiles.append(serializeTile(tile))
        map = MapModel(
            id = str(uuid.uuid4()),
            tiles = (json.dumps(tiles))
        )
        room.map = map.id
        db.session.add(map)
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
        s_leaving_player = serializePlayer(leaving_player)
        if not s_leaving_player in players:
            return 'Player is not in the room', 406
        players.remove(s_leaving_player)
        room.players = json.dumps(players)
        leaving_player.ready = False
        db.session.add(leaving_player)
        db.session.add(room)
        db.session.commit()
        response = serializeRoom(room)
        response['players'] = json.loads(room.players) 
        return response
    

    '''
    {
        "room":
        {
            "id":"73d38bf6-ba81-486d-a054-00ceef9c13d6"
        }
    }
    '''

    @app.route('/map/get', methods=['GET'])
    #@marshal_with(map_resource_fields)
    def getMap():
        #room = RoomModel.query.get(data['room']['id'])
        #if not room:
        #    return 'Invalid information'
        response = []
        tiles = []
        for i in range(16):
            for j in range(16):
                tile = TileModel(
                    id = str(uuid.uuid4()),
                    x = i+1,
                    y = j+1,
                    occupied = False
                )
                db.session.add(tile)
                tiles.append(serializeTile(tile))
        map = MapModel(
            id = str(uuid.uuid4()),
            tiles = (json.dumps(tiles))
        )
        db.session.add(map)
        response.append({
            'id': map.id,
            'tiles': tiles
        })
        for m in range(3):
            tiles = []
            for i in range(16):
                for j in range(16):
                    occupied  = True if random.randint(1,10) < m else False
                    tile = TileModel(
                        id = str(uuid.uuid4()),
                        x = i+1,
                        y = j+1,
                        occupied = occupied
                    )
                    db.session.add(tile)
                    tiles.append(serializeTile(tile))
            map = MapModel(
                id = str(uuid.uuid4()),
                tiles = (json.dumps(tiles))
            )
            db.session.add(map)
            response.append({
            'id': map.id,
            'tiles': tiles
        })
        db.session.commit()
        
        return response
    
    @app.route('/game/step', methods=['POST'])
    def playerStep():
        data = request.get_json()
        '''if not data['player']:
            return 'Missing player information', 406
        if not data['steps']:
            return 'Missing movement information', 406'''
        next_player = control.step(data)
        if not next_player:
            return "invalid step"
        return 'Done! Next player: ' + str(next_player)

    @app.route('/game/start', methods=['POST'])
    def startGame():
        data = request.get_json()
        if not data['room']:
            return 'Missing room information', 406
        if not data['room']['id']:
            return 'Missing room ID', 406
        room = RoomModel.query.get(data['room']['id'])
        if not room:
            return 'Invalid room', 406
        if(len(json.loads(room.players)) < 2 ):
            return 'Not enogh players to start the game!', 406
        game = control.startGame(room)
        room.ready = True
        db.session.add(room)
        db.session.commit()
        return 'Game started! Next_player ' + game['current_player']
    @app.route('/game/state', methods=['GET'])
    def getState():
        player_id = request.args.get('id')
        game = control.getState(player_id)
        if not game:
            return 'Game not found', 406
        return {
            'turn': game['turn'],
            'number_of_players': len(game['players']),
            'current_player': game['current_player'],
            'map' : game['map'],
            'history': game['history']
        }

player_put_args = reqparse.RequestParser()
player_put_args.add_argument("name", type=str, help="Name of player is required", required=True)
player_put_args.add_argument("id", type=int, help="ID of player is required", required=True)

if  __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Time server")
    parser.add_argument('--port', type=int)
    args = parser.parse_args()
    
    app.run(host='127.0.0.1', port=args.port)