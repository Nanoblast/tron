import uuid
class Player(object):
    def __init__(self, name):
        self.name = name
        self.id = str(uuid.uuid4())