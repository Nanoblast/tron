from flask import Flask
from flask_restful import Api, Resource

app = Flask(__name__)
api = Api(app)

class Player(Resource):
    def get(self):
        return {"data":"blank"}

class Map(Resource):
    def get(self):
        return {"data":"blank"}

class Tile(Resource):
    def get(self):
        return {"data":"blank"}

class Room(Resource):
    def get(self):
        return {"data:":"blank"}


api.add_resource(Player, "/player")
api.add_resource(Map, "/map")
api.add_resource(Tile, "/tile")
api.add_resource(Room, "/room")

if  __name__ == "__main__":
    app.run(debug = True)