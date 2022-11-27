class BasicMap(object):
    map = {}

    def __init__(self) -> None:
        for x in range(16):
            for y in range(16):
                self.map[x+1,y+1] = [
                    #x-1, y
                    (max(x, 1), y+1),
                    #x+1, y
                    (min(x+2, 16), y+1),
                    #x, y-1
                    (x+1, max(y, 1)),
                    #x, y+1
                    (x+1, min(y+2, 16))
                ]

