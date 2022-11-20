from flask import Flask, jsonify, request
from flask_restful import Api, Resource
from src.gameControl import GameControl
import argparse

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

@app.route('/room', methods=['GET'])
def getRooms():
    rooms = control.getRooms()
    response = {'rooms': []}
    for room in rooms:
        response['rooms'].append(room.jsonify())
    return response

@app.route('/room/create', methods=['POST'])
def createRoom():
    data = request.get_json()
    if not 'player' in data:
        return '', 403
    newRoom = control.createRoom(data['player'])
    return newRoom.jsonify()
@app.route('/room/join', methods=['POST'])
def joinRoom():
    data = request.get_json()
    response = str(control.joinRoom(data))
    return {"success": response}
@app.route('/room/leave', methods=['POST'])
def leaveRoom():
    data = request.get_json()
    control.leaveRoom(data)
    return ''
if  __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Time server")
    parser.add_argument('--port', type=int)
    args = parser.parse_args()

    app.run(host='127.0.0.1', port=args.port)