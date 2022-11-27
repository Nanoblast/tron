'use strict';

class AbstractScene {
    constructor(manager) {
        this.manager = manager
        this.canvasHandler = new CanvasHandler();

        this.eventListener = this.onKeyPressed.bind(this)
    }

    init() {
        this.canvasHandler.init()

        window.addEventListener('keydown', this.eventListener, false);
    }

    genericErrorHandlerFunction(handle, status, response) {
        if (handle.dialog != null) {
            handle.dialog.close()
        }

        if (status === 0) {
            response = 'Could not connect to the server'
        }

        handle.dialog = new ErrorDialog(handle, response)
        handle.dialog.setCloseCallback((handle) => {
            handle.canvasHandler.removeElement(handle.dialog)
            handle.dialog = null
        })
        handle.canvasHandler.addElement(handle.dialog)
    }

    halt() {
        window.removeEventListener('keydown', this.eventListener)
        this.manager = null
        this.canvasHandler.isRunning = false
        this.canvasHandler.emptyElements()
        this.canvasHandler = null
        this.eventListener = null
    }

    onKeyPressed(e) {
        throw "Abstract method for onKeyPressed not implemented"
    }
}

class TronGameScene extends AbstractScene {
    constructor(manager) {
        super(manager)

        this.pendingMovements = []
        this.player = new Tron(4, 4)
    }

    init() {
        super.init()

        this.canvasHandler.addElement(new Map(this.canvasHandler, 16, 16))
        this.canvasHandler.getElement(0).addPlayer(this.player.x, this.player.y)
    }

    onKeyPressed(e) {
        let lastCoord = null

        if (this.pendingMovements.length > 0) {
            lastCoord = this.pendingMovements[this.pendingMovements.length - 1]
        } else {
            lastCoord = new PendingMove(this.player.y, this.player.x)
        }

        let validMovement = 0

        if (e.keyCode === 37 || e.keyCode === 65) { //LEFT
            if (lastCoord.x > 0) {
                validMovement = Directions.Left
            }
        } else if(e.keyCode === 38 || e.keyCode === 87) { //UP
            if (lastCoord.y > 0) {
                validMovement = Directions.Up
            }
        } else if(e.keyCode === 39 || e.keyCode === 68) { //RIGHT
            if (lastCoord.x < 15) {
                validMovement = Directions.Right
            }
        } else if(e.keyCode === 40 || e.keyCode === 83) { //DOWN
            if (lastCoord.y < 15) {
                validMovement = Directions.Down
            }
        } else if (e.keyCode === 27) {
            // TODO: This is temporary
            new LeaveRoomDataHandler(this, this.manager.room_id, this.manager.player_id)
            .setErrorCallback(this.genericErrorHandlerFunction)
            .startRequest((handle, data) => {
                handle.manager.changeScene(new RoomListScene(handle.manager))
            })
        }

        if (validMovement > 0) {
            let newX = lastCoord.x
            let newY = lastCoord.y

            switch(validMovement) {
                case Directions.Up:
                    newY--
                    break
                case Directions.Left:
                    newX--
                    break
                case Directions.Right:
                    newX++
                    break
                case Directions.Down:
                    newY++
                    break
            }

            if (this.pendingMovements.find(elem => elem.x == newX && elem.y == newY)) {
                return;
            }

            if (newX == this.player.x && newY == this.player.y) {
                return;
            }

            let newMovement = new PendingMove(newX, newY);

            this.pendingMovements.push(newMovement)
            this.canvasHandler.getElement(0).addPendingMove(newMovement.x, newMovement.y, 0)
        }
    }
}

class RoomListScene extends AbstractScene {
    init() {
        super.init()

        this.roomList = new RoomListElem()
        this.dialog = null

        this.canvasHandler.addElement(this.roomList)

        new GetRoomListDataHandler(this)
        .setErrorCallback(this.genericErrorHandlerFunction)
        .startRequest((handle, data) => {
            this.roomList.updateRoomList(data)
        })
    }

    onKeyPressed(e) {
        e.preventDefault()

        if (this.dialog != null) {
            this.dialog.onKeyPressed(e)
            return
        }

        if (e.keyCode === 38 || e.keyCode === 87) { //UP
            this.roomList.selectPreviousRoom()
        } else if(e.keyCode === 40 || e.keyCode === 83) { //DOWN
            this.roomList.selectNextRoom()
        } else if (e.keyCode === 82) {
            new GetRoomListDataHandler(this)
            .setErrorCallback(this.genericErrorHandlerFunction)
            .startRequest((handle, data) => {
                this.roomList.updateRoomList(data)
            })
        } else if (e.keyCode === 13) {
            this.dialog = new DialogElem(this)
            this.dialog.addOption('Pin (4-digits)', OptionType.Password, 4)
            this.dialog.buttonManager.setButtonCallback(0, (handle, options) => {
                if (options[0].value.length < 4) {
                    return
                }

                new JoinRoomDataHandler(handle, handle.roomList.getSelectedData().id, handle.manager.player_id)
                .setErrorCallback(this.genericErrorHandlerFunction)
                .startRequest((handle, data) => {
                    handle.manager.room_id = handle.roomList.getSelectedData().id
                    handle.manager.changeScene(new RoomDetailScene(handle.manager))
                })
            })
            this.dialog.buttonManager.setButtonCallback(1, (handle, options) => {
                handle.dialog.close()
            })
            this.dialog.setCloseCallback((handle) => {
                handle.canvasHandler.removeElement(handle.dialog)
                handle.dialog = null
            })
            this.canvasHandler.addElement(this.dialog)
        } else if (e.keyCode === 67) {
            new CreateRoomDataHandler(this, this.manager.player_id)
            .setErrorCallback(this.genericErrorHandlerFunction)
            .startRequest((handle, data) => {
                handle.manager.room_id = data['id']
                handle.manager.changeScene(new RoomDetailScene(handle.manager))
            })
        }
    }
}

class RoomDetailScene extends AbstractScene {
    constructor(manager) {
        super(manager)

        this.dialog = null
        this.intervalId = null

        this.getRoomData()
    }

    getRoomData() {
        new GetRoomDataHandler(this, this.manager.room_id)
        .setErrorCallback(this.genericErrorHandlerFunction)
        .startRequest((handle, data) => {
            handle.playerList.emptyPlayers()

            data['players'].forEach(element => {
                handle.playerList.addPlayer(element)
            });

            if (this.intervalId == null) {
                this.intervalId = setInterval(this.getRoomData.bind(handle), 5000)
            }
        })
    }

    init() {
        super.init()

        this.playerList = new PlayerListElem(this, true)
        this.playerList.buttonManager.setButtonCallback(0, (handle) => {
            new StartGameDataHandler(handle, handle.manager.room_id)
            .setErrorCallback(this.genericErrorHandlerFunction)
            .startRequest((handle, data) => {
                handle.manager.changeScene(new TronGameScene(handle.manager))
            })
        })
        this.playerList.buttonManager.setButtonCallback(1, (handle) => {
            new LeaveRoomDataHandler(handle, handle.manager.room_id, handle.manager.player_id)
            .setErrorCallback(this.genericErrorHandlerFunction)
            .startRequest((handle, data) => {
                handle.manager.changeScene(new RoomListScene(this.manager))
            })
        })
        this.playerList.buttonManager.setButtonCallback(2, (handle) => {
            handle.playerList.buttonManager.getSelectedButton().setText('Set Not Ready')
        })
        this.playerList.buttonManager.setButtonCallback(3, (handle) => {
            handle.dialog = new DialogElem(handle)
            handle.dialog.addOption('Count (0-3)', OptionType.ComputerNumber, 1)
            handle.dialog.buttonManager.setButtonCallback(0, (handle, options) => {
                if (options[0].value.length < 1) {
                    return
                }

                handle.dialog.close()
            })
            handle.dialog.buttonManager.setButtonCallback(1, (handle, options) => {
                handle.dialog.close()
            })
            handle.dialog.setCloseCallback((handle) => {
                handle.canvasHandler.removeElement(handle.dialog)
                handle.dialog = null
            })
            handle.canvasHandler.addElement(handle.dialog)
        })
        this.playerList.buttonManager.setButtonCallback(4, (handle) => {
            handle.dialog = new DialogElem(handle)
            handle.dialog.addOption('Pin (4-digits)', OptionType.Password, 4)
            handle.dialog.buttonManager.setButtonCallback(0, (handle, options) => {
                if (options[0].value.length < 4) {
                    return
                }

                handle.dialog.close()
            })
            handle.dialog.buttonManager.setButtonCallback(1, (handle, options) => {
                handle.dialog.close()
            })
            handle.dialog.setCloseCallback((handle) => {
                handle.canvasHandler.removeElement(handle.dialog)
                handle.dialog = null
            })
            handle.canvasHandler.addElement(handle.dialog)
        })

        this.canvasHandler.addElement(this.playerList)
    }

    halt() {
        if (this.intervalId != null) {
            clearInterval(this.intervalId)
        }

        super.halt()
    }

    onKeyPressed(e) {
        if (this.dialog != null) {
            this.dialog.onKeyPressed(e)
            return
        }

        if (e.keyCode === 13) {
            this.playerList.onButtonPushed()
        } else if(e.keyCode === 38) { //UP
            this.playerList.buttonManager.selectPreviousButton()
        } else if(e.keyCode === 40) { //DOWN
            this.playerList.buttonManager.selectNextButton()
        }
    }   
}

class InitialScene extends AbstractScene {
    constructor(manager) {
        super(manager)

        this.dialog = new DialogElem(this, false)
        this.dialog.addOption('Name', OptionType.String, 20)
        this.dialog.buttonManager.setButtonCallback(0, (handle, options) => {
            if (options[0].value.length == 0) {
                return
            }

            new CreatePlayerDataHandler(handle, options[0].value)
            .setErrorCallback(this.genericErrorHandlerFunction)
            .startRequest((handle, data) => {
                handle.manager.player_id = data['id']
                handle.dialog.close()
                handle.manager.changeScene(new RoomListScene(this.manager))
            })
        })
        this.dialog.setCloseCallback((handle) => {
            handle.canvasHandler.removeElement(handle.dialog)
            handle.dialog = null
        })
        this.canvasHandler.addElement(this.dialog)
        this.canvasHandler.addElement(new TitleTextElem('Welcome to Labyritron! Select a display name!'))
    }

    onKeyPressed(e) {
        if (this.dialog != null) {
            this.dialog.onKeyPressed(e)
            return
        }
    }
}

class SceneManager {
    constructor() {
        this.scene = new InitialScene(this)
        this.player_id = null
        this.room_id = null
    }

    init() {
        this.scene.init()
    }

    changeScene(scene) {
        this.scene.halt()

        this.scene = scene

        this.scene.init()
    }
}