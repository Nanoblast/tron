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

with app.app_context():
    db.create_all()
    print('database init done')