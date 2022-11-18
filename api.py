from flask import Flask, jsonify, request
from flask_restful import Api, Resource
from src.gameControl import GameControl

app = Flask(__name__)
api = Api(app)
control = GameControl()

@app.route('/player', methods=['GET'])
def getPlayers():
    players = control.getPlayers()
    response = {'players': []}
    for player in players:
        response['players'].append(player.jsonify())
    return response
    
@app.route('/player/create', methods=['POST'])
def registerPlayer():
    data = request.get_json()
    if not 'name' in data:
        return '', 403
    name = data['name']
    player = control.createPlayer(name)
    return player.jsonify()

class Tile(Resource):
    def get(self):
        return {"data":"blank"}
@app.route('/room/create', methods=['POST'])
def createRoom():
    data = request.get_json()
    if not 'player' in data:
        return '', 403
    newRoom = control.createRoom(data['player'])
    return newRoom.jsonify()

if  __name__ == "__main__":
    app.run(debug = True)