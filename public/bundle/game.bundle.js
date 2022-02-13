// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class Rectangle {
    xPos;
    yPos;
    width;
    height;
    fillStyle = 'green';
    strokeStyle = '#00000000';
    constructor(r){
        this.xPos = r.xPos;
        this.yPos = r.yPos;
        this.width = r.width;
        this.height = r.height;
    }
    draw(ctx, gridScale) {
        ctx.fillStyle = this.fillStyle;
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillRect(this.xPos * gridScale, this.yPos * gridScale, this.width * gridScale, this.height * gridScale);
        ctx.strokeRect(this.xPos * gridScale, this.yPos * gridScale, this.width * gridScale, this.height * gridScale);
    }
}
class HoverableBase extends Rectangle {
}
class Clickable extends Rectangle {
    onClick() {}
    checkIfClicked(x, y) {
        const offsetX = x - this.xPos;
        const offsetY = y - this.yPos;
        if (offsetX > 0 && offsetY > 0 && offsetX < this.width && offsetY < this.height) {
            this.onClick();
            return true;
        }
        return false;
    }
}
function HoverableMixin(Base) {
    return class HoverableMixin extends Base {
        isHovered = false;
        onHover() {}
        offHover() {}
        checkHovering(x, y) {
            const offsetX = x - this.xPos;
            const offsetY = y - this.yPos;
            if (offsetX > 0 && offsetY > 0 && offsetX < this.width && offsetY < this.height) {
                if (!this.isHovered) {
                    this.isHovered = true;
                    this.onHover();
                }
                return true;
            } else {
                if (this.isHovered) {
                    this.isHovered = false;
                    this.offHover();
                }
                return false;
            }
        }
    };
}
HoverableMixin(HoverableBase);
const HoverableClickable = HoverableMixin(Clickable);
const ccw = (A, B, C)=>(C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
;
const intersect = (A, B, C, D)=>ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D)
;
class Structure extends HoverableClickable {
    fillStyle = 'purple';
    altitude = 1;
    getBoundaries(gridScale) {
        const xPos = this.xPos * gridScale;
        const yPos = this.yPos * gridScale;
        const width = this.width * gridScale;
        const height = this.height * gridScale;
        return [
            [
                {
                    x: xPos,
                    y: yPos
                },
                {
                    x: xPos + width,
                    y: yPos
                }, 
            ],
            [
                {
                    x: xPos,
                    y: yPos + height
                },
                {
                    x: xPos + width,
                    y: yPos + height
                }, 
            ],
            [
                {
                    x: xPos,
                    y: yPos
                },
                {
                    x: xPos,
                    y: yPos + height
                }, 
            ],
            [
                {
                    x: xPos + width,
                    y: yPos
                },
                {
                    x: xPos + width,
                    y: yPos + height
                }, 
            ], 
        ];
    }
    constructor(s){
        super(s);
        this.xPos = s.xPos;
        this.yPos = s.yPos;
        this.width = s.width;
        this.height = s.height;
    }
    onHover() {
        this.fillStyle = 'red';
    }
    offHover() {
        this.fillStyle = 'purple';
    }
    onClick() {
        console.log('STRUCTURE CLICKED');
    }
    collidesOnGrid(target) {
        const xOffset = target.xPos = this.xPos;
        const yOffset = target.yPos = this.yPos;
        return xOffset >= 0 && yOffset >= 0 && xOffset < this.width && yOffset < this.height;
    }
    blocksView(target, actor, gridScale) {
        if (target.altitude >= this.altitude && actor.altitude >= this.altitude) return false;
        for (const boundary of this.getBoundaries(gridScale)){
            if (intersect(target.absolutePosition, actor.absolutePosition, ...boundary)) {
                if (boundary[0].x === boundary[1].x) {
                    const targetXOffset = Math.abs(target.absolutePosition.x - boundary[0].x);
                    if (targetXOffset < gridScale && target.standingOn === this) return false;
                    const actorXOffset = Math.abs(actor.absolutePosition.x - boundary[0].x);
                    if (actorXOffset < gridScale && actor.standingOn === this) return false;
                } else if (boundary[0].y === boundary[1].y) {
                    const targetYOffset = Math.abs(target.absolutePosition.y - boundary[0].y);
                    if (targetYOffset < gridScale && target.standingOn === this) return false;
                    const actorYOffset = Math.abs(actor.absolutePosition.y - boundary[0].y);
                    if (actorYOffset < gridScale && actor.standingOn === this) return false;
                }
                return true;
            }
        }
        return false;
    }
}
class Board {
    canvas;
    context;
    structures;
    entities;
    layers;
    grid;
    gridSize = {
        x: 40,
        y: 60
    };
    _gridScale = 20;
    get gridScale() {
        return this._gridScale;
    }
    showGrid = true;
    game;
    get hoverables() {
        return this.entities.filter((e)=>{
            if (e.checkHovering) {
                if (e instanceof Cell) {
                    return e.visible;
                }
                return true;
            }
        });
    }
    get clickables() {
        return this.entities.filter((e)=>e.checkIfClicked
        );
    }
    constructor(canvas1, game){
        this.game = game;
        this.canvas = canvas1;
        this.setCanvasScale();
        const ctx = this.canvas.getContext('2d');
        this.context = ctx;
        this.structures = [];
        this.entities = [];
        this.layers = new Map();
        this.layers.set('units', new Map());
        this.layers.set('overlay', new Map());
        this.canvas.addEventListener('click', (ev)=>{
            ev.preventDefault();
            for (const clickable of this.clickables){
                clickable.checkIfClicked(ev.offsetX / this.gridScale, ev.offsetY / this.gridScale);
            }
        });
        this.canvas.addEventListener('mousemove', (e)=>{
            let isHovering = false;
            for (const hoverable of this.hoverables){
                if (hoverable.checkHovering(e.offsetX / this.gridScale, e.offsetY / this.gridScale)) {
                    isHovering = true;
                }
            }
            if (isHovering) this.canvas.style.cursor = "pointer";
            else this.canvas.style.cursor = "default";
        });
        this.canvas.addEventListener('mouseleave', ()=>{
            for (const hoverable of this.hoverables){
                hoverable.offHover();
            }
            this.canvas.style.cursor = "default";
        });
        this.grid = new Map();
        for(let x = 0; x < this.gridSize.x; x++){
            for(let y = 0; y < this.gridSize.y; y++){
                const cell = new Cell(x, y);
                this.grid.set(`${x},${y}`, cell);
                this.entities.push(cell);
            }
        }
    }
    setCanvasScale() {
        let width = Math.min(this.gridSize.x * this.gridScale, this.canvas.parentElement.clientWidth);
        let height = this.gridSize.y * this.gridScale;
        if (this.canvas.parentElement.clientWidth < this.canvas.parentElement.clientHeight) {
            width -= width % this.gridSize.x;
            this._gridScale = width / this.gridSize.x;
            height = this.gridSize.y * this.gridScale;
        } else {
            height = Math.min(this.gridSize.y * this.gridScale, this.canvas.parentElement.clientHeight);
            height -= width % this.gridSize.y;
            this._gridScale = height / this.gridSize.y;
            width = this.gridSize.x * this.gridScale;
        }
        console.log(width, height);
        this.canvas.width = width;
        this.canvas.height = height;
    }
    registerStructure(struc, symmetrical = false) {
        this.structures.push(struc);
        this.entities.push(struc);
        if (symmetrical) {
            const sym = new Structure({
                ...struc,
                xPos: this.gridSize.x - struc.width - struc.xPos,
                yPos: this.gridSize.y - struc.height - struc.yPos
            });
            this.structures.push(sym);
            this.entities.push(sym);
        }
    }
    registerEntitity(ent, layerId) {
        this.entities.push(ent);
        if (ent.onRegister) ent.onRegister();
        if (layerId) {
            const layer = this.layers.get(layerId);
            if (layer) {
                const id = ent.uuid || crypto.randomUUID();
                layer.set(id, ent);
                return id;
            }
        }
    }
    unregisterEntity(layerId, id) {
        const layer = this.layers.get(layerId);
        if (layer) layer.delete(id);
    }
    draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const structure of this.structures){
            structure.draw(this.context, this.gridScale);
        }
        for (const cell of this.grid.values()){
            cell.draw(this.context, this.gridScale);
        }
        for (const layer of this.layers.values()){
            for (const drawable of layer.values()){
                drawable.draw(this.context, this.gridScale);
            }
        }
        if (this.showGrid) {
            this.context.strokeStyle = '#ffffff50';
            this.context.lineWidth = 1;
            this.context.beginPath();
            for(let x = 0; x < this.canvas.width; x += this.gridScale){
                this.context.moveTo(x, 0);
                this.context.lineTo(x, this.canvas.height);
            }
            for(let y = 0; y < this.canvas.height; y += this.gridScale){
                this.context.moveTo(0, y);
                this.context.lineTo(this.canvas.width, y);
            }
            this.context.stroke();
        }
    }
}
class Cell extends HoverableClickable {
    visible = false;
    callbacks = [];
    constructor(xPos, yPos){
        super({
            xPos,
            yPos,
            width: 1,
            height: 1
        });
        this.fillStyle = "#ffffff30";
        this.strokeStyle = '#ffffff30';
    }
    offHover() {
        this.fillStyle = "#ffffff30";
    }
    onHover() {
        this.fillStyle = "#fffffff0";
    }
    onClick() {
        if (this.visible) {
            console.log(this.xPos, this.yPos);
            for (const callback of this.callbacks){
                callback(this);
            }
            this.callbacks = [];
        }
    }
    addCallback(cb) {
        this.callbacks.push(cb);
    }
    clearCallbacks() {
        this.callbacks = [];
    }
    draw(ctx, gridScale) {
        if (this.visible) super.draw(ctx, gridScale);
    }
}
class TargetOutline extends Rectangle {
    draw(ctx, gridScale) {
        this.strokeStyle = 'orange';
        this.fillStyle = '#00000000';
        super.draw(ctx, gridScale);
    }
}
const statusColors = {
    opponent: 'darkred',
    active: 'blue',
    activated: 'slateblue',
    unactivated: 'green',
    dead: 'black'
};
class Unit extends HoverableClickable {
    health;
    speed;
    uuid;
    shootingSkill;
    fightingSkill;
    armor;
    agility;
    isHyperAgile;
    actionPoints;
    equipment;
    actions;
    status;
    board;
    isTargetable = true;
    altitude = 0;
    get absolutePosition() {
        return {
            x: this.xPos * this.board.gridScale + this.board.gridScale / 2,
            y: this.yPos * this.board.gridScale + this.board.gridScale / 2
        };
    }
    standingOn;
    constructor(board1){
        super({
            height: 1,
            width: 1,
            xPos: 20,
            yPos: 20
        });
        this.uuid = crypto.randomUUID();
        this.board = board1;
        this.status = 'unactivated';
        this.health = 10;
        this.speed = 10;
        this.shootingSkill = 0.5;
        this.fightingSkill = 0.5;
        this.armor = 1;
        this.agility = 1;
        this.isHyperAgile = false;
        this.actionPoints = 3;
        this.equipment = [];
        this.checkAltitude();
    }
    shootAt(u, weapon) {}
    registerActions(actions) {
        if (!this.actions) this.actions = [];
        this.actions = this.actions.concat(actions);
    }
    validTargets = [];
    draw(ctx, gridScale) {
        this.fillStyle = statusColors[this.status];
        ctx.lineWidth = 3;
        super.draw(ctx, gridScale);
        if (this.status === 'active') {
            ctx.beginPath();
            const startingX = this.xPos * gridScale + gridScale / 2;
            const startingY = this.yPos * gridScale + gridScale / 2;
            ctx.arc(startingX, startingY, this.speed * gridScale + gridScale / 2, 0, Math.PI * 2);
            ctx.stroke();
            for (const target of this.validTargets){
                const { x , y  } = this.absolutePosition;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.strokeStyle = 'orange';
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            }
        }
    }
    onClick() {
        if (this.status === 'unactivated') {
            this.status = 'active';
            this.checkValidCells();
            this.checkValidTargets();
            console.log(this.validTargets);
        }
    }
    checkValidTargets() {
        for (const unit of this.board.entities.filter((e)=>e instanceof Unit
        )){
            if (unit.xPos === this.xPos && unit.yPos === this.yPos) continue;
            let targetable = true;
            for (const structure of this.board.structures){
                if (structure.blocksView(unit, this, this.board.gridScale)) {
                    targetable = false;
                    break;
                }
            }
            if (targetable) {
                this.board.registerEntitity(new TargetOutline(unit), 'overlay');
            }
        }
    }
    checkValidCells() {
        const cells = this.board.grid;
        const gridScale = this.board.gridScale;
        const centerX = this.xPos * gridScale + gridScale / 2;
        const centerY = this.yPos * gridScale + gridScale / 2;
        for(let x = this.xPos - this.speed; x <= this.xPos + this.speed; x++){
            let xCoord = 0;
            if (x > this.xPos) xCoord = x * gridScale;
            else if (x < this.xPos) xCoord = (x + 1) * gridScale;
            else xCoord = x * gridScale + gridScale / 2;
            for(let y = this.yPos - this.speed; y <= this.yPos + this.speed; y++){
                let yCoord = 0;
                if (y > this.yPos) yCoord = y * gridScale;
                else if (y < this.yPos) yCoord = (y + 1) * gridScale;
                else yCoord = y * gridScale + gridScale / 2;
                const xOffset = centerX - xCoord;
                const yOffset = centerY - yCoord;
                const maxDistance = this.speed * gridScale + gridScale / 2;
                if (xOffset * xOffset + yOffset * yOffset < maxDistance * maxDistance && (x !== this.xPos || y !== this.yPos)) {
                    const cell = cells.get(`${x},${y}`);
                    if (cell) {
                        cell.visible = true;
                        cell.addCallback(this.moveCallback);
                    }
                }
            }
        }
    }
    moveCallback = (cell)=>{
        this.xPos = cell.xPos;
        this.yPos = cell.yPos;
        this.checkAltitude();
        this.checkValidTargets();
        for (const cell1 of this.board.grid.values()){
            cell1.visible = false;
            cell1.clearCallbacks();
        }
    };
    checkAltitude() {
        let maxAltitude = 0;
        let standingOn;
        for (const structure of this.board.structures){
            const xOffset = this.xPos - structure.xPos;
            const yOffset = this.yPos - structure.yPos;
            if (xOffset >= 0 && yOffset >= 0 && xOffset < structure.width && yOffset < structure.height) {
                maxAltitude = Math.max(structure.altitude, maxAltitude);
                standingOn = structure;
            }
        }
        this.altitude = maxAltitude;
        this.standingOn = standingOn;
    }
    onRegister() {
        this.checkAltitude();
    }
}
const canvas = document.querySelector("#game-board");
const board = new Board(canvas);
board.registerStructure(new Structure({
    xPos: 5,
    yPos: 15,
    width: 15,
    height: 10
}), true);
board.registerStructure(new Structure({
    xPos: 30,
    yPos: 7,
    width: 7,
    height: 12
}), true);
setInterval(()=>board.draw()
, 100 / 6);
const gridToggle = document.querySelector('#show-grid');
gridToggle.checked = board.showGrid;
gridToggle.addEventListener('change', function(e) {
    e.preventDefault();
    board.showGrid = !board.showGrid;
    gridToggle.checked = board.showGrid;
});
const testUnit = new Unit(board);
testUnit.xPos = 15;
testUnit.yPos = 14;
const testUnit2 = new Unit(board);
testUnit2.xPos = 20;
testUnit2.yPos = 35;
board.registerEntitity(testUnit, 'units');
board.registerEntitity(testUnit2, 'units');
window.board = board;
