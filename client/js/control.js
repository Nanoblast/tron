'use strict';

class AbstractScene {
    constructor(manager) {
        this.manager = manager
        this.canvasHandler = new CanvasHandler();

        this.eventListener = this.superKeyPressed.bind(this)

        this.dialog = null
    }

    createErrorDialog(text) {
        this.createDialog(new ErrorDialog(this, text))
    }

    createDialog(dialog = null) {
        this.dialog = dialog
        this.dialog.setCloseCallback((handle) => {
            handle.removeDialog()
        })
        this.canvasHandler.addElement(this.dialog)
    }

    removeDialog() {
        this.canvasHandler.removeElement(this.dialog)
        this.dialog = null
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

        handle.createErrorDialog(response)
    }

    halt() {
        if (this.dialog != null) {
            this.removeDialog()
        }

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

    superKeyPressed(e) {
        e.preventDefault()

        if (this.dialog != null) {
            this.dialog.onKeyPressed(e)
            return
        }

        this.onKeyPressed(e)
    }
}

class TronGameScene extends AbstractScene {
    constructor(manager) {
        super(manager)

        this.pendingMovements = []
        this.player = new Tron(4, 4)
        this.map = null
        this.hasGameStarted = false
        this.activePlayer = null

        this.playerIdToColor = {}
    }

    init() {
        super.init()

        this.map = new Map(this.canvasHandler, 16, 16)
        this.notifyElem = new NotificationElem()

        this.canvasHandler.addElement(this.map)
        this.canvasHandler.addElement(this.notifyElem)

        this.intervalId = null

        this.getStateData()
    }

    halt() {
        if (this.intervalId != null) {
            clearInterval(this.intervalId)
        }

        super.halt()
    }

    getStateData() {
        new GetGameStateDataHandler(this, this.manager.player_id)
        .setErrorCallback((handle, status, response) => {
            if (handle.dialog != null) {
                handle.dialog.close()
            }
    
            if (status === 0) {
                response = 'Could not connect to the server'
            }

            if (this.intervalId != null) {
                clearInterval(this.intervalId)
                this.intervalId = null
            }
    
            if (handle.hasGameStarted) {
                handle.createDialog(new GameOverDialog(handle, false))
            } else {
                handle.createErrorDialog(response)
            }
            handle.dialog.setCloseCallback((handle) => {
                if (handle.hasGameStarted) {
                    handle.manager.room_id = null
                    handle.manager.changeScene(new RoomListScene(handle.manager))
                } else {
                    handle.removeDialog()

                    if (this.intervalId == null) {
                        this.intervalId = setInterval(this.getStateData.bind(handle), 5000)
                    }
                }
            })
        })
        .startRequest((handle, data) => {
            let playerTiles = []
            let lineTiles = []

            if (handle.hasGameStarted && data['number_of_players'] == 1) {
                handle.createDialog(new GameOverDialog(handle, true))

                if (this.intervalId != null) {
                    clearInterval(this.intervalId)
                    this.intervalId = null
                }

                handle.dialog.setCloseCallback((handle) => {
                    handle.manager.room_id = null
                    handle.manager.changeScene(new RoomListScene(handle.manager))
                })

                return
            }

            handle.map.clear()

            data['map'].forEach(element => {
                if (element['player'] != null) {
                    if (element['occupied']) {
                        lineTiles.push(element)
                    } else {
                        playerTiles.push(element)
                    }
                } else {
                    if (element['occupied']) {
                        handle.map.addObstacle(element['x'] - 1, element['y'] - 1)
                    }
                }
            });

            if (handle.manager.player_id == data['current_player'] && this.activePlayer != data['current_player']) {
                this.notifyElem.setText('Your turn!')
            } else if (handle.activePlayer != data['current_player'] && handle.activePlayer != handle.manager.player_id) {
                this.notifyElem.setText("Other's turn!")
            }

            handle.activePlayer = data['current_player']

            let currentPlayer = playerTiles.find((elem) => elem.player == handle.manager.player_id)

            if (currentPlayer != undefined) {
                handle.player = new Tron(currentPlayer.x - 1, currentPlayer.y - 1)
            }

            // source: https://stackoverflow.com/questions/44356237/sortable-uuid-v1-for-multi-platform-application
            const rearrangeId = uuid => {
                let [low, mid, hiAndVersion] = uuid.split('-')
              
                return [hiAndVersion, mid, low].join('')
            }

            playerTiles.sort((a, b) => {
                let rearranged1 = rearrangeId(a.player)
                let rearranged2 = rearrangeId(b.player)
              
                if (rearranged1 > rearranged2) {
                  return 1
                }
              
                return -1
            })

            /* Making the color permanent */
            if (Object.keys(handle.playerIdToColor).length == 0) {
                for (let i = 0; i < playerTiles.length; i++) {
                    handle.playerIdToColor[playerTiles[i].player] = i
                }
            }

            for (let i = 0; i < playerTiles.length; i++) {
                let player = handle.map.addPlayer(playerTiles[i].x - 1, playerTiles[i].y - 1, handle.playerIdToColor[playerTiles[i].player])

                data['players'].forEach(element => {
                    if (element.id == playerTiles[i].player) {
                        player.name = element.name
                    }
                });

                let steps = data['history'][playerTiles[i].player]

                let lastDirection = Directions.Right

                for (let j = 0; j < steps.length - 1; j++) {
                    let diff = {'x': steps[j].x - steps[j + 1].x, 'y': steps[j].y - steps[j + 1].y}

                    let newDirection = null

                    if (diff.x < 0) {
                        newDirection = Directions.Right
                    } else if (diff.x > 0) {
                        newDirection = Directions.Left
                    } else if (diff.y > 0) {
                        newDirection = Directions.Up
                    } else if (diff.y < 0) {
                        newDirection = Directions.Down
                    }

                    handle.map.addLine(steps[j].x - 1, steps[j].y - 1, handle.playerIdToColor[playerTiles[i].player], Directions.negate(lastDirection), newDirection)

                    if (j == steps.length - 2) {
                        handle.map.setPlayerDirection(steps[steps.length - 1].x - 1, steps[steps.length - 1].y - 1, newDirection)
                    }

                    lastDirection = newDirection
                }
            }

            if (this.intervalId == null) {
                this.intervalId = setInterval(this.getStateData.bind(handle), 5000)
            }

            this.hasGameStarted = true
        })
    }

    onKeyPressed(e) {
        let lastCoord = null

        if (this.pendingMovements.length > 0) {
            lastCoord = this.pendingMovements[this.pendingMovements.length - 1]
        } else {
            lastCoord = new PendingMove(this.player.x, this.player.y)
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
            this.pendingMovements = []
            this.map.clearPendingMoves()
        } else if (e.keyCode === 13) {
            if (this.pendingMovements.length < 4) {
                this.createErrorDialog("Must use all four steps")
            } else {
                let steps = []

                steps.push({'x': this.player.x + 1, 'y': this.player.y + 1})

                this.pendingMovements.forEach(element => {
                    steps.push({'x': element.x + 1, 'y': element.y + 1})
                });

                new StepDataHandler(this, this.manager.player_id, steps)
                .setErrorCallback(this.genericErrorHandlerFunction)
                .startRequest((handle, data) => {
                    this.pendingMovements = []
                    this.map.clearPendingMoves()
                    handle.getStateData()
                })
            }
        }

        if (this.pendingMovements.length > 3) {
            return
        }

        if (validMovement > 0 && this.activePlayer == this.manager.player_id) {
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

            let playerColor = Object.keys(this.playerIdToColor).length > 0 ? this.playerIdToColor[this.manager.player_id] : 0

            this.canvasHandler.getElement(0).addPendingMove(newMovement.x, newMovement.y, playerColor)
        }
    }
}

class RoomListScene extends AbstractScene {
    init() {
        super.init()

        this.roomList = new RoomListElem()

        this.canvasHandler.addElement(this.roomList)

        new GetRoomListDataHandler(this)
        .setErrorCallback(this.genericErrorHandlerFunction)
        .startRequest((handle, data) => {
            this.roomList.updateRoomList(data)
        })
    }

    onKeyPressed(e) {
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
            if (this.roomList.getSelectedData().protected) {
                this.createDialog(new DialogElem(this))

                this.dialog.addOption('Pin (4-digits)', OptionType.Password, 4)
                this.dialog.buttonManager.setButtonCallback(0, (handle, options) => {
                    if (options[0].value.length < 4) {
                        return
                    }

                    new JoinRoomDataHandler(handle, handle.roomList.getSelectedData().id, handle.manager.player_id, parseInt(options[0].value))
                    .setErrorCallback(this.genericErrorHandlerFunction)
                    .startRequest((handle, data) => {
                        handle.manager.room_id = handle.roomList.getSelectedData().id
                        handle.manager.changeScene(new RoomDetailScene(handle.manager))
                    })
                })
                this.dialog.buttonManager.setButtonCallback(1, (handle, options) => {
                    handle.dialog.close()
                })
            } else {
                new JoinRoomDataHandler(this, this.roomList.getSelectedData().id, this.manager.player_id)
                .setErrorCallback(this.genericErrorHandlerFunction)
                .startRequest((handle, data) => {
                    handle.manager.room_id = handle.roomList.getSelectedData().id
                    handle.manager.changeScene(new RoomDetailScene(handle.manager))
                })
            }
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

        this.intervalId = null
        this.mapList = null
        this.isPlayerReady = false

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

            let is_master = data['master'] == handle.manager.player_id

            if (handle.playerList.setMasterState(is_master)) {
                handle.setButtonCallbacks()
            }

            if (is_master) {
                handle.playerList.setProtectionState(data['protected'])
            }

            if (data['ready']) {
                handle.manager.changeScene(new TronGameScene(handle.manager))
            }

            if (this.mapList != null) {
                this.mapList.clearVotes()
                this.mapList.setVotes(data['votes'])

                data['votes'].forEach(element => {
                    if (Object.keys(element)[0] == handle.manager.player_id) {
                        this.isPlayerReady = true
                    }
                });
            }

            if (this.intervalId == null) {
                this.intervalId = setInterval(this.getRoomData.bind(handle), 5000)
            }
        })
    }

    setButtonCallbacks() {
        this.playerList.buttonManager.setButtonCallback(3, (handle) => {
            handle.createDialog(new DialogElem(handle))

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
        })
        this.playerList.buttonManager.setButtonCallback(4, (handle) => {
            handle.createDialog(new DialogElem(handle))

            handle.dialog.addOption('Pin (4-digits)', OptionType.Password, 4)
            handle.dialog.buttonManager.setButtonCallback(0, (handle, options) => {
                if (options[0].value.length < 4) {
                    return
                }

                handle.dialog.close()

                new SetRoomPasswordDataHandler(handle, handle.manager.room_id, options[0].value)
                .setErrorCallback(this.genericErrorHandlerFunction)
                .startRequest((handle, data) => {
                    handle.getRoomData()
                })
            })
            handle.dialog.buttonManager.setButtonCallback(1, (handle, options) => {
                handle.dialog.close()
            })
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
                handle.manager.changeScene(new RoomListScene(handle.manager))
            })
        })
        this.playerList.buttonManager.setButtonCallback(2, (handle) => {
            if (!this.isPlayerReady) {
                new SetReadyDataHandler(handle, handle.manager.player_id, this.mapList.selectedMap + 1)
                .setErrorCallback(this.genericErrorHandlerFunction)
                .startRequest((handle, data) => {
                    handle.getRoomData()
                })
            }
            //handle.playerList.buttonManager.getSelectedButton().setText('Set Not Ready')
        })

        this.canvasHandler.addElement(this.playerList)

        this.mapList = new MapListElem()

        this.canvasHandler.addElement(this.mapList)

        new GetMapsDataHandler(this, this.manager.room_id)
        .setErrorCallback(this.genericErrorHandlerFunction)
        .startRequest((handle, data) => {
            handle.mapList.clear()

            data.forEach(element => {
                handle.mapList.addMap(element)
            });
        })
    }

    halt() {
        if (this.intervalId != null) {
            clearInterval(this.intervalId)
        }

        super.halt()
    }

    onKeyPressed(e) {
        if (e.keyCode === 13) {
            this.playerList.onButtonPushed()
        } else if(e.keyCode === 38) { //UP
            this.playerList.buttonManager.selectPreviousButton()
        } else if(e.keyCode === 40) { //DOWN
            this.playerList.buttonManager.selectNextButton()
        } else if (e.keyCode === 37 || e.keyCode === 65) { //LEFT
            if (!this.isPlayerReady) {
                this.mapList.selectPreviousMap()
            }
        } else if(e.keyCode === 39 || e.keyCode === 68) { //RIGHT
            if (!this.isPlayerReady) {
                this.mapList.selectNextMap()
            }
        }
    }   
}

class InitialScene extends AbstractScene {
    constructor(manager) {
        super(manager)

        this.createDialog(new DialogElem(this, false))

        this.dialog.addOption('Name', OptionType.String, 20)
        this.dialog.buttonManager.setButtonCallback(0, (handle, options) => {
            if (options[0].value.length == 0) {
                return
            }

            new CreatePlayerDataHandler(handle, options[0].value)
            .setErrorCallback(this.genericErrorHandlerFunction)
            .startRequest((handle, data) => {
                handle.manager.player_id = data['id']
                handle.manager.changeScene(new RoomListScene(handle.manager))
            })
        })
        this.canvasHandler.addElement(new TitleTextElem('Welcome to Labyritron! Select a display name!\nKeyboard only!'))
    }

    onKeyPressed(e) {
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