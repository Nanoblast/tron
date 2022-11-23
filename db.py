class DB(metaclass=Singleton):
    def __init__(self, db):
        self.db = db
    