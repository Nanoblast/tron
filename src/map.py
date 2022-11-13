from tile import Tile
import array as arr
class Map(object):
    def __init__(self):
        self.tiles = []
        #Tile initialization   
        for i in range(16):
            x = []
            for j in range(16):
                x.append(Tile(i+1, j+1))
            self.tiles.append(x)
