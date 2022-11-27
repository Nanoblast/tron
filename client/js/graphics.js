'use strict';

const Directions = {
	Up: 1,
	Left: 2,
	Right: 3,
	Down: 4
}

const OptionType = {
    String: 1,
    Password: 2,
    ComputerNumber: 3
}

const Colors = {
    DarkUi: "#316d77",
    LightUi: "#66dff2",
    UiShadow: "#3a4f5b",
    ErrorText: "#FF2222",
    Background: "#0a0f15"
}

class AbstractUiElem {
    draw(ctx) {
        throw "Abstract method for UiElem draw not implemented"
    }

    /**
     * Draws a rounded rectangle using the current state of the canvas.
     * If you omit the last three params, it will draw a rectangle
     * outline with a 5 pixel border radius
     * 
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} x The top left x coordinate
     * @param {Number} y The top left y coordinate
     * @param {Number} width The width of the rectangle
     * @param {Number} height The height of the rectangle
     * @param {Number} [radius = 5] The corner radius; It can also be an object 
     *                 to specify different radii for corners
     * @param {Number} [radius.tl = 0] Top left
     * @param {Number} [radius.tr = 0] Top right
     * @param {Number} [radius.br = 0] Bottom right
     * @param {Number} [radius.bl = 0] Bottom left
     * @param {Boolean} [fill = false] Whether to fill the rectangle.
     * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
     * 
     * Source: https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas/68359160#68359160
     */
    roundRect(
        ctx,
        x,
        y,
        width,
        height,
        radius = 5,
        fill = false,
        stroke = true
    ) {
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            radius = {...{tl: 0, tr: 0, br: 0, bl: 0}, ...radius};
        }

        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();

        if (fill) {
            ctx.fill();
        }

        if (stroke) {
            ctx.stroke();
        }
    }
}

class TileElem extends AbstractUiElem {
    static tileSize = 0

    constructor(map, x, y) {
        super()

        this.map = map
        this.x = x
        this.y = y
    }

    getStartX() {
        return window.innerWidth / 2 - TileElem.tileSize * 8 + this.x * TileElem.tileSize
    }

    getStartY() {
        return window.innerHeight / 2 - TileElem.tileSize * 7.5 + this.y * TileElem.tileSize
    }
}

class EmptyElem extends TileElem {
    constructor(map, x, y) {
        super(map, x, y)
    }

    draw(ctx) {
        ctx.strokeStyle = Colors.LightUi
        ctx.shadowBlur = 2;
        ctx.shadowColor = Colors.UiShadow;

        this.roundRect(ctx, this.getStartX() + 3, this.getStartY() + 3, TileElem.tileSize - 6, TileElem.tileSize - 6, 5)
    }
}

class LineElem extends EmptyElem {
    constructor(map, from, to, x, y, player_id) {
        super(map, x, y)

        this.from = from
        this.to = to
        this.player_id = player_id
    }

    draw(ctx) {
        super.draw(ctx)

        ctx.fillStyle = TronElem.getPlayerColor(this.player_id)
        ctx.shadowColor = TronElem.getPlayerShadowColor(this.player_id)

        let directions = [this.from, this.to]

        ctx.beginPath()

        if (directions.includes(Directions.Up)) {
            ctx.rect(this.getStartX() + TileElem.tileSize / 2 - TileElem.tileSize / 16, this.getStartY(), TileElem.tileSize / 8, TileElem.tileSize / 2)
        }

        if (directions.includes(Directions.Down)) {
            ctx.rect(this.getStartX() + TileElem.tileSize / 2 - TileElem.tileSize / 16, this.getStartY() + TileElem.tileSize / 2, TileElem.tileSize / 8, TileElem.tileSize / 2)
        }

        if (directions.includes(Directions.Left)) {
            ctx.rect(this.getStartX(), this.getStartY() + TileElem.tileSize / 2 - TileElem.tileSize / 16, TileElem.tileSize / 2 + TileElem.tileSize / 16, TileElem.tileSize / 8)
        }

        if (directions.includes(Directions.Right)) {
            ctx.rect(this.getStartX() + TileElem.tileSize / 2 - TileElem.tileSize / 16, this.getStartY() + TileElem.tileSize / 2 - TileElem.tileSize / 16, TileElem.tileSize / 2 + TileElem.tileSize / 16, TileElem.tileSize / 8)
        }

        ctx.fill()
        ctx.closePath()
    }
}

class ObstacleElem extends EmptyElem {
    constructor(map, x, y) {
        super(map, x, y)
    }

    draw(ctx) {
        ctx.fillStyle = Colors.LightUi
        ctx.strokeStyle = Colors.LightUi
        ctx.shadowBlur = 2;
        ctx.shadowColor = Colors.UiShadow;

        this.roundRect(ctx, this.getStartX() + 3, this.getStartY() + 3, TileElem.tileSize - 6, TileElem.tileSize - 6, 5, true)
    }
}

class PendingMoveElem extends EmptyElem {
    constructor(map, x, y, player_id) {
        super(map, x, y)

        this.player_id = player_id
    }

    draw(ctx) {
        super.draw(ctx)

        ctx.fillStyle = TronElem.getPlayerColor(this.player_id)
        ctx.shadowColor = TronElem.getPlayerShadowColor(this.player_id)

        ctx.fillRect(this.getStartX() + TileElem.tileSize / 2 - TileElem.tileSize / 4, this.getStartY() + TileElem.tileSize / 2 - TileElem.tileSize / 4, TileElem.tileSize / 2, TileElem.tileSize / 2)
    }
}

class TronElem extends EmptyElem {
    constructor(map, x, y) {
        super(map, x, y)

        this.blurState = 0
        this.player = 0
        this.direction = Directions.Up
    }

    static getPlayerColor(player_id) {
        switch(player_id) {
            case 0:
                return '#FF2222'
        }
    }

    static getPlayerShadowColor(player_id) {
        switch(player_id) {
            case 0:
                return '#651010'
        }
    }

    setDirection(dir) {
        this.direction = dir
    }

    draw(ctx) {
        super.draw(ctx)

        if (this.map.handler.currentFrame % 20 == 0) {
            this.blurState = this.blurState == 0 ? 2 : 0
        }

        ctx.fillStyle = TronElem.getPlayerColor(this.player)
        ctx.shadowBlur = this.blurState
        ctx.shadowColor = Colors.UiShadow;

        let radius = TileElem.tileSize / 6
        let startX = this.getStartX() + TileElem.tileSize / 2 - radius
        let startY = this.getStartY() + TileElem.tileSize / 24
        let diffCircles = TileElem.tileSize - radius * 2

        ctx.save()
        ctx.translate(startX + TileElem.tileSize / 6, startY + TileElem.tileSize / 2);

        switch(this.direction) {
            case 1:
                break;
            case 2:
                ctx.rotate(Math.PI / 2 * 3);
                break;
            case 4:
                ctx.rotate(Math.PI);
                break;
            default:
                ctx.rotate(Math.PI / 2);
                break;
        }

        startX = -TileElem.tileSize / 6
        startY = -TileElem.tileSize / 2

        ctx.beginPath()
        ctx.moveTo(startX, startY + radius);
        ctx.bezierCurveTo(startX, startY + radius, startX + radius, startY + radius * 2, startX, startY + diffCircles + radius);
        ctx.moveTo(startX + radius * 2, startY + radius);
        ctx.bezierCurveTo(startX + radius * 2, startY + radius, startX + radius, startY + radius * 2, startX + radius * 2, startY + diffCircles + radius);
        ctx.stroke()
        ctx.closePath()

        ctx.beginPath()
        ctx.arc(startX + radius, startY + radius, radius, 0, 2.0 * Math.PI)
        ctx.fill()
        ctx.closePath()

        ctx.beginPath()
        ctx.fillStyle = Colors.Background
        ctx.arc(startX + radius, startY + radius, radius - radius / 4.0, 0, 2.0 * Math.PI)
        ctx.fill()
        ctx.closePath()

        ctx.beginPath()
        ctx.fillStyle = TronElem.getPlayerColor(this.player)
        ctx.arc(startX + radius, startY + diffCircles + radius, radius, 0, 2.0 * Math.PI)
        ctx.fill()
        ctx.closePath()

        ctx.beginPath()
        ctx.fillStyle = Colors.Background
        ctx.arc(startX + radius, startY + diffCircles + radius, radius - radius / 4.0, 0, 2.0 * Math.PI)
        ctx.fill()
        ctx.closePath()

        ctx.beginPath()
        ctx.fillStyle = TronElem.getPlayerColor(this.player)
        ctx.shadowColor = TronElem.getPlayerShadowColor(this.player)
        ctx.rect(startX + radius - 1, startY + radius * 2.0 + radius / 3.0, 2, radius);
        ctx.fill()
        ctx.closePath()
        ctx.shadowColor = Colors.UiShadow

        ctx.beginPath()
        ctx.fillStyle = TronElem.getPlayerColor(this.player)
        ctx.shadowColor = TronElem.getPlayerShadowColor(this.player)
        ctx.rect(startX + radius - 1, startY + diffCircles + radius, 2, radius);
        ctx.fill()
        ctx.closePath()
        ctx.shadowColor = Colors.UiShadow

        ctx.beginPath();
        ctx.arc(startX + radius, startY + radius, radius, 0, 2 * Math.PI);
        ctx.stroke()
        ctx.closePath()

        ctx.beginPath()
        ctx.arc(startX + radius, startY + diffCircles + radius, radius, 0, 2 * Math.PI);
        ctx.stroke()
        ctx.closePath()

        ctx.restore()

        ctx.shadowBlur = 2
    }
}

class Map extends AbstractUiElem {
    constructor(handler, width, height) {
        super()

        this.handler = handler
        this.width = width
        this.height = height
        this.tiles = Array.from(Array(height), () => new Array(width))

        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                this.tiles[i][j] = null;
            }
        }
    }

    addPendingMove(x, y, player_id) {
        this.tiles[y][x] = new PendingMoveElem(this, x, y, player_id)
    }

    addPlayer(x, y) {
        this.tiles[y][x] = new TronElem(this, x, y)
    }

    setPlayerDirection(x, y, dir) {
        this.tiles[y][x].setDirection(dir)
    }

    draw(ctx) {
        let empty = new EmptyElem();

        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.tiles[i][j] == null) {
                    empty.x = j
                    empty.y = i
                    empty.map = this
                    empty.draw(ctx)
                } else {
                    this.tiles[i][j].draw(ctx)
                }
            }
        }
    }
}

class RoomElem extends AbstractUiElem {
    constructor(handle, id, room) {
        super()

        this.handle = handle
        this.id = id
        this.room = room
        this.selected = false

        this.lockImage = new Image();
        this.lockImage.src = 'client/img/lock.svg'

        this.lockGrayImage = new Image();
        this.lockGrayImage.src = 'client/img/lock_gray.svg'
    }

    draw(ctx) {
        if (this.id > this.handle.selected + 4 || this.id < this.handle.selected) {
            return
        }

        if (this.selected) {
            ctx.strokeStyle = Colors.LightUi
            ctx.fillStyle = Colors.LightUi
        } else {
            ctx.strokeStyle = Colors.DarkUi
            ctx.fillStyle = Colors.DarkUi
        }

        let drawPlace = this.id - this.handle.selected

        ctx.shadowBlur = 2;
        ctx.shadowColor = Colors.UiShadow;

        let startX = window.innerWidth / 2 - window.innerWidth / 3 / 2
        let startY = drawPlace * (window.innerHeight / 6 + window.innerHeight / 24) + window.innerHeight / 10 + window.innerHeight / 30
        let rectWidth = window.innerWidth / 3
        let rectHeight = window.innerHeight / 6

        this.roundRect(ctx, startX, startY, rectWidth, rectHeight)

        ctx.textAlign = 'center'

        ctx.fillText('Room #' + (this.id + 1), window.innerWidth / 2, startY + rectHeight / 8)

        ctx.textAlign = 'left'

        ctx.fillText('Players: ' + this.room.players.length + '/4', startX + rectWidth / 50, startY + rectHeight * (3 / 8))

        if (this.room.players.length > 0) {
            let master = this.room.players.find((elem) => elem.id == this.room.master)

            if (master !== undefined) {
                ctx.fillText('Host: ' + master.name, startX + rectWidth / 50, startY + rectHeight / 2)
            }
        }

        if ("passwd" in this.room) {
            ctx.drawImage(this.selected ? this.lockImage : this.lockGrayImage, startX + rectWidth - rectHeight / 6 - rectHeight / 12, startY + rectHeight / 16, rectHeight / 6, rectHeight / 6)
        }
    }
}

class RoomListElem extends AbstractUiElem {
    constructor() {
        super()

        this.rooms = []
        this.selected = 0
    }

    draw(ctx) {
        ctx.textAlign = 'center'
        let fontSize = window.innerHeight / 60
        ctx.font = fontSize + 'px Arial'
        ctx.fillText('Press "C" to create a new room, "R" to refresh, and "Return" to join', window.innerWidth / 2, window.innerHeight / 10)
        ctx.fillText('Navigate in the room list using the up and down arrow keys', window.innerWidth / 2, window.innerHeight / 10 + fontSize + 2)

        this.rooms.forEach(element => {
            element.draw(ctx)
        });
    }

    getSelectedData() {
        return this.rooms[this.selected].room
    }

    selectRoom(number) {
        if (number < 0) {
            return
        }

        if (number >= this.rooms.length) {
            return
        }

        this.rooms[this.selected].selected = false
        this.rooms[number].selected = true
        this.selected = number
    }

    selectPreviousRoom() {
        this.selectRoom(this.selected - 1)
    }
    
    selectNextRoom() {
        this.selectRoom(this.selected + 1)
    }

    updateRoomList(rooms) {
        this.rooms = []

        rooms.forEach(element => {
            this.rooms.push(new RoomElem(this, this.rooms.length, element))
        });

        if (this.rooms.length > 0) {
            this.rooms[0].selected = true
            this.selected = 0
        }
    }
}

class DialogOptionElem extends AbstractUiElem {
    constructor(dialog, id, name, type, maxlen) {
        super()

        this.dialog = dialog
        this.id = id
        this.name = name
        this.type = type
        this.maxlen = maxlen
        this.value = ''
        this.selected = false
    }

    addCharacter(e) {
        if (this.value.length >= this.maxlen) {
            return
        }

        let key = e.keyCode

        if ((e.keyCode < 65 || e.keyCode > 90) && (e.keyCode < 48 || e.keyCode > 57)) {
            return
        }

        if ((this.type == OptionType.Password) && (e.keyCode >= 65 && e.keyCode <= 90)) {
            return
        }

        if ((this.type == OptionType.ComputerNumber) && ((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 52 && e.keyCode <= 57))) {
            return
        }

        if ((e.keyCode >= 65 && e.keyCode <= 90) && !e.shiftKey) {
            key += 32
        }

        this.value += String.fromCharCode(key)
    }

    removeCharacter() {
        if (this.value.length == 0) {
            return
        }

        this.value = this.value.slice(0, -1)
    }

    draw(ctx) {
        if (this.selected) {
            ctx.strokeStyle = Colors.LightUi
            ctx.fillStyle = Colors.LightUi
        } else {
            ctx.strokeStyle = Colors.DarkUi
            ctx.fillStyle = Colors.DarkUi
        }

        let fontSize = window.innerHeight / 60
        ctx.font = fontSize + 'px Arial'

        ctx.textAlign = 'left'
        ctx.textBaseline = "middle";

        //let startX = this.dialog.startX + window.innerWidth / 60
        let startX = this.dialog.startX + this.dialog.rectWidth / 2 - (this.dialog.getLongestNamedOptionWidth(ctx) + 5 + this.dialog.rectWidth * (6 / 10)) / 2
        let startY = this.dialog.startY + this.id * (fontSize * 3) + this.dialog.rectHeight / 10

        ctx.fillText(this.name, startX, startY + (fontSize + 6) / 2)

        ctx.fillText(this.value, startX + this.dialog.getLongestNamedOptionWidth(ctx) + 7, startY + (fontSize + 6) / 2)

        this.roundRect(ctx, startX + this.dialog.getLongestNamedOptionWidth(ctx) + 5, startY, this.dialog.rectWidth * (6 / 10), fontSize + 6) 

        ctx.textBaseline = 'alphabetic'
    }
}

class ButtonElem extends AbstractUiElem {
    constructor(id, text) {
        super()

        this.id = id
        this.text = text
        this.selected = false
        this.callback = null
    }

    setDimensions(x, y, width, height) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }

    setText(text) {
        this.text = text
    }

    draw(ctx) {
        if (this.selected) {
            ctx.strokeStyle = Colors.LightUi
            ctx.fillStyle = Colors.LightUi
        } else {
            ctx.strokeStyle = Colors.DarkUi
            ctx.fillStyle = Colors.DarkUi
        }

        this.roundRect(ctx, this.x, this.y, this.width, this.height)

        ctx.textAlign = 'center'
        ctx.textBaseline = "middle";

        ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2)

        ctx.textBaseline = "alphabetic";
    }
}

class ButtonManager {
    constructor(handle) {
        this.handle = handle
        this.buttons = []
        this.selectedButton = 0
    }

    addButton(name) {
        let button = new ButtonElem(this.buttons.length, name)

        if (this.buttons.length == 0) {
            button.selected = true
        }

        this.buttons.push(button)
    }

    getSelectedButton() {
        return this.buttons[this.selectedButton]
    }

    selectButton(number) {
        if (number < 0) {
            return
        }

        if (number >= this.buttons.length) {
            number = 0
        }

        this.buttons[this.selectedButton].selected = false
        this.buttons[number].selected = true
        this.selectedButton = number
    }

    selectPreviousButton() {
        this.selectButton(this.selectedButton - 1)
    }
    
    selectNextButton() {
        this.selectButton(this.selectedButton + 1)
    }

    setButtonCallback(button, callback) {
        this.buttons[button].callback = callback
    }
}

class DialogElem extends AbstractUiElem {
    constructor(handle, hasCancel = true) {
        super()

        this.options = []
        this.buttonManager = new ButtonManager(handle)
        this.buttonManager.addButton('OK')

        if (hasCancel) {
            this.buttonManager.addButton('Cancel')
        }

        this.selectedOption = 0
        this.closeCallback = null
        this.handle = handle

        this.startX = 0
        this.startY = 0
        this.rectWidth = 0
        this.rectHeight = 0
    }

    addOption(name, type, maxlen) {
        let optionElem = new DialogOptionElem(this, this.options.length, name, type, maxlen)

        if (this.options.length == 0) {
            optionElem.selected = true
        }

        this.options.push(optionElem)
    }

    close() {
        if (this.closeCallback != null) {
            this.closeCallback(this.handle)
        }
    }

    getLongestNamedOptionWidth(ctx) {
        let length = 0

        this.options.forEach(element => {
            let temp = ctx.measureText(element.name)
            
            if (temp.width > length) {
                length = temp.width
            }
        });

        return length
    }

    setCloseCallback(callback) {
        this.closeCallback = callback
    }

    onButtonPushed() {
        let button = this.buttonManager.getSelectedButton()

        if (button.callback != null) {
            button.callback(this.handle, this.options)
        }
    }

    onKeyPressed(e) {
        if (e.keyCode === 13) {
            this.onButtonPushed()
        } else if (e.keyCode === 27) {
            this.close()
        } else if(e.keyCode === 38) { //UP
            this.selectPreviousOption()
        } else if(e.keyCode === 40) { //DOWN
            this.selectNextOption()
        } else if (e.keyCode === 37) { //LEFT
            this.buttonManager.selectPreviousButton()
        } else if(e.keyCode === 39) { //RIGHT
            this.buttonManager.selectNextButton()
        } else if (e.keyCode === 8) {
            this.options[this.selectedOption].removeCharacter()
        } else if (e.keyCode === 9) {
            this.buttonManager.selectNextButton()
        } else {
            this.options[this.selectedOption].addCharacter(e)
        }
    }

    selectOption(number) {
        if (number < 0) {
            return
        }

        if (number >= this.options.length) {
            return
        }

        this.options[this.selectedOption].selected = false
        this.options[number].selected = true
        this.selectedOption = number
    }

    selectPreviousOption() {
        this.selectOption(this.selectedOption - 1)
    }
    
    selectNextOption() {
        this.selectOption(this.selectedOption + 1)
    }

    draw(ctx) {
        let fontSize = window.innerHeight / 60
        ctx.font = fontSize + 'px Arial'

        ctx.strokeStyle = Colors.LightUi
        ctx.fillStyle = Colors.Background

        this.rectWidth = window.innerWidth * (5 / 12)
        this.rectHeight = window.innerHeight / 5
        this.startX = window.innerWidth / 2 - this.rectWidth / 2
        this.startY = window.innerHeight / 2 - this.rectHeight / 2

        this.roundRect(ctx, this.startX, this.startY, this.rectWidth, this.rectHeight, 5, true)
        this.roundRect(ctx, this.startX, this.startY, this.rectWidth, this.rectHeight)

        this.buttonManager.buttons[0].setDimensions(this.startX + this.rectWidth / 10, this.startY + this.rectHeight - this.rectHeight / 5, this.rectWidth / 4, this.rectHeight / 10)

        if (this.buttonManager.buttons.length > 1) {
            this.buttonManager.buttons[1].setDimensions(this.startX + this.rectWidth - this.rectWidth / 4 - this.rectWidth / 10, this.startY + this.rectHeight - this.rectHeight / 5, this.rectWidth / 4, this.rectHeight / 10)
        }
        
        this.options.forEach(element => {
            element.draw(ctx)
        });

        this.buttonManager.buttons.forEach(element => {
            element.draw(ctx)
        });
    }
}

class PlayerListElem extends AbstractUiElem {
    constructor(handle, is_master) {
        super()

        this.players = []
        this.handle = handle

        this.buttonManager = new ButtonManager(handle)
        this.buttonManager.addButton('Start Game')
        this.buttonManager.addButton('Leave Room')
        this.buttonManager.addButton('Set Ready')

        if (is_master) {
            this.buttonManager.addButton('Set Computer Count')
            this.buttonManager.addButton('Set Password')
        }
    }

    emptyPlayers() {
        this.players = []
    }

    addPlayer(player) {
        this.players.push(player)
    }

    removePlayer(player) {
        const index = this.players.indexOf(player);

        if (index > -1) {
            this.players.splice(index, 1);
        }
    }

    onButtonPushed() {
        let button = this.buttonManager.getSelectedButton()

        if (button.callback != null) {
            button.callback(this.handle)
        }
    }

    draw(ctx) {
        ctx.textAlign = 'center'
        let fontSize = window.innerHeight / 60
        ctx.font = fontSize + 'px Arial'
        ctx.fillText('Navigate in the room options using the up and down arrow keys', window.innerWidth / 2, window.innerHeight / 10)

        for (let i = 0; i < 4; i++) {
            let playerExists = this.players.length > i

            if (playerExists && this.players[i].ready) {
                ctx.strokeStyle = Colors.LightUi
                ctx.fillStyle = Colors.LightUi
            } else {
                ctx.strokeStyle = Colors.DarkUi
                ctx.fillStyle = Colors.DarkUi
            }

            let oneWidth = window.innerWidth / 6
            let spacing = window.innerWidth / 16

            this.roundRect(ctx, window.innerWidth / 2 - (oneWidth * 2 + spacing + spacing / 2) + i * (oneWidth + spacing), window.innerHeight / 10 + fontSize * 2, oneWidth, fontSize * 6)

            ctx.textAlign = 'center'

            let text = playerExists ? this.players[i].name : 'No player'

            ctx.fillText(text, window.innerWidth / 2 - (oneWidth * 2 + spacing + spacing / 2) + i * (oneWidth + spacing) + oneWidth / 2, window.innerHeight / 10 + fontSize * 5)

            this.buttonManager.buttons.forEach(elem => {
                elem.setDimensions(window.innerWidth / 2 - window.innerWidth / 8, window.innerHeight / 10 + fontSize * 10 + elem.id * (fontSize * 3), window.innerWidth / 4, fontSize + fontSize / 2)
                elem.draw(ctx)
            });
        }
    }
}

class ErrorDialog extends DialogElem {
    constructor(handle, text) {
        super(handle, false)

        this.text = text

        this.buttonManager.setButtonCallback(0, (handle, options) => {
            handle.dialog.close()
        })
    }

    draw(ctx) {
        super.draw(ctx)

        ctx.textAlign = 'center'
        ctx.fillStyle = Colors.ErrorText

        ctx.fillText(this.text, this.startX + this.rectWidth / 2, this.startY + this.rectHeight / 2)
    }
}

class TitleTextElem extends AbstractUiElem {
    constructor(text) {
        super()

        this.text = text
    }

    draw(ctx) {
        ctx.textAlign = 'center'
        let fontSize = window.innerHeight / 60
        ctx.font = fontSize + 'px Arial'
        ctx.fillText(this.text, window.innerWidth / 2, window.innerHeight / 10)
    }
}

class CanvasHandler {
    constructor() {
        this.currentFrame = 0
        this.elements = []
        this.isRunning = false
    }

    addElement(elem) {
        this.elements.push(elem)
    }

    emptyElements() {
        this.elements = []
    }

    getElement(index) {
        return this.elements[index]
    }

    removeElement(elem) {
        const index = this.elements.indexOf(elem);

        if (index > -1) {
            this.elements.splice(index, 1);
        }
    }

    draw() {
        if (!this.isRunning) {
            return
        }

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        let fontSize = window.innerHeight / 20
        this.ctx.font = fontSize + "px Arial";
        this.ctx.textAlign = "center";
        this.ctx.shadowBlur = 2
        this.ctx.shadowColor = 'black'
        this.ctx.fillStyle = Colors.LightUi
        this.ctx.fillText("Labyritron", window.innerWidth / 2, fontSize + window.innerHeight / 80)

        this.elements.forEach(element => {
            element.draw(this.ctx)
        });

        this.currentFrame += 1

        requestAnimationFrame(this.draw.bind(this));
    }

    init() {
        this.canvas = $("#gameField").get(0);
        this.ctx = this.canvas.getContext("2d");

        window.addEventListener('resize', this.resize.bind(this), false);

        this.isRunning = true

        this.resize();
    }

    halt() {
        this.isRunning = false
    }

    resize() {
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        let smaller = window.innerWidth / window.innerHeight

        if (smaller < 1) {
            smaller = window.innerWidth
        } else {
            smaller = window.innerHeight
        }

        let tileSize = smaller / 18

        TileElem.tileSize = tileSize
                    
        this.draw();
    }
}