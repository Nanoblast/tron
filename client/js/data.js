'use strict';

class GameObject {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

class Obstacle extends GameObject {
    constructor(x, y) {
        super(x, y)
    }
}

class Tron extends GameObject {
    constructor(x, y) {
        super(x, y)

        this.lines = []
    }
}

class TronLine extends GameObject {
    constructor(x, y) {
        super(x, y)
    }
}

class PendingMove extends GameObject {
    constructor(x, y) {
        super(x, y)
    }
}

class Room {
    constructor(id, map, master) {
        this.id = id
        this.map = map
        this.master = master
        this.passwd = null
        this.players = []
    }
}

class AbstractDataHandler {
    constructor(handle, endpoint, type = 'GET') {
        this.handle = handle
        this.baseUrl = "http://172.23.198.143:5000/"
        this.data = null
        this.params = null
        this.endpoint = endpoint
        this.type = type
        this.errorCallback = null
    }

    setErrorCallback(callback) {
        this.errorCallback = callback

        return this
    }

    startRequest(callback) {
        let request = {
            type: this.type,
            url: this.baseUrl + this.endpoint,
            success: (data) => {
                if (callback != null) {
                    callback(this.handle, data)
                }
            },
            error: (xhr, status, error) => {
                if (this.errorCallback != null) {
                    this.errorCallback(this.handle, xhr.status, xhr.responseText)
                }
            }
        }

        if (this.data != null) {
            request['data'] = JSON.stringify(this.data)
            request['contentType'] = "application/json; charset=utf-8"
        }

        if (this.params != null) {
            request['data'] = jQuery.param(this.params) ,
            request['contentType'] = 'application/x-www-form-urlencoded; charset=UTF-8'
        }

        $.ajax(request);
    }
}

class CreateMapDataHandler extends AbstractDataHandler {
    constructor(handle) {
        super(handle, "map/create")
    }
}

class GetRoomListDataHandler extends AbstractDataHandler {
    constructor(handle) {
        super(handle, "rooms")
    }
}

class CreatePlayerDataHandler extends AbstractDataHandler {
    constructor(handle, name) {
        super(handle, "player/create", 'POST')

        this.data = {'name': name}
    }
}

class GetPlayersDataHandler extends AbstractDataHandler {
    constructor(handle) {
        super(handle, 'player')
    }
}

class GetRoomDataHandler extends AbstractDataHandler {
    constructor(handle, room_id) {
        super(handle, 'room')

        this.params = {'id': room_id}
    }
}

class JoinRoomDataHandler extends AbstractDataHandler {
    constructor(handle, room_id, player_id) {
        super(handle, 'room/join', 'POST')
        
        this.data = {'room': {'id': room_id}, 'player': {'id': player_id}}
    }
}

class LeaveRoomDataHandler extends AbstractDataHandler {
    constructor(handle, room_id, player_id) {
        super(handle, 'room/leave', 'POST')

        this.data = {'room': {'id': room_id}, 'player': {'id': player_id}}
    }
}

class CreateRoomDataHandler extends AbstractDataHandler {
    constructor(handle, player_id) {
        super(handle, 'room/create', 'POST')

        this.data = {'player': {'id': player_id}}
    }
}

class StartGameDataHandler extends AbstractDataHandler {
    constructor(handle, room_id) {
        super(handle, 'game/start', 'POST')

        this.data = {'room': {'id': room_id}}
    }
}

class GetMapsDataHandler extends AbstractDataHandler {
    constructor(handle) {
        super(handle, 'map/get')
    }
}

class SetReadyDataHandler extends AbstractDataHandler {
    constructor(handle, player_id) {
        super(handle, 'player/ready', 'POST')

        this.data = {'id': player_id}
    }
}

class GetGameStateDataHandler extends AbstractDataHandler {
    constructor(handle, player_id) {
        super(handle, 'game/state')

        this.params = {'id': player_id}
    }
}