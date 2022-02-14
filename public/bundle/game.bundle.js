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
        ctx.shadowColor = '#00000000';
        ctx.strokeRect(this.xPos * gridScale, this.yPos * gridScale, this.width * gridScale, this.height * gridScale);
    }
}
class Line {
    x1;
    y1;
    x2;
    y2;
    xPos;
    yPos;
    strokeStyle;
    constructor(l, color = 'white'){
        this.x1 = l.x1;
        this.y1 = l.y1;
        this.x2 = l.x2;
        this.y2 = l.y2;
        this.xPos = (l.x1 + l.x2) / 2;
        this.yPos = (l.y1 + l.y2) / 2;
        this.strokeStyle = color;
    }
    draw(ctx, gridScale) {
        ctx.strokeStyle = this.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }
}
class HoverableBase extends Rectangle {
}
class Clickable extends Rectangle {
    onClick() {}
    checkIfClicked(p, gridScale) {
        const offsetX = p.x - this.xPos * gridScale;
        const offsetY = p.y - this.yPos * gridScale;
        if (offsetX > 0 && offsetY > 0 && offsetX < this.width * gridScale && offsetY < this.height * gridScale) {
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
        checkHovering(p, gridScale) {
            const offsetX = p.x - this.xPos * gridScale;
            const offsetY = p.y - this.yPos * gridScale;
            if (offsetX > 0 && offsetY > 0 && offsetX < this.width * gridScale && offsetY < this.height * gridScale) {
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
class Vector {
    x;
    y;
    _angle;
    _length;
    get length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    set length(length) {
        this._length = length;
        this.calculateXY();
    }
    get angle() {
        this._angle = Math.atan2(this.x, this.y);
        return this._angle;
    }
    set angle(angle) {
        this._angle = angle;
        this.calculateXY();
    }
    calculateXY() {
        this.x = this._length * Math.sin(this._angle);
        this.y = this._length * Math.cos(this._angle);
    }
    constructor(vector, origin){
        this.x = vector.x;
        this.y = vector.y;
        this._length = this.length;
        this._angle = this.angle;
    }
    static from(p1, p2) {
        const point = {
            x: (p1.x || p1.xPos || 1) - (p2.x || p2.xPos || 1),
            y: (p1.y || p1.yPos || 1) - (p2.y || p2.yPos || 1)
        };
        return new Vector(point);
    }
}
class VectorLine extends Vector {
    xPos;
    yPos;
    constructor(p, v){
        super(v);
        this.xPos = p.x;
        this.yPos = p.y;
        this.length = 1;
    }
    draw(ctx, gridScale) {
        ctx.strokeStyle = 'red';
        ctx.fillStyle = 'grey';
        ctx.shadowColor = 'blue';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 5;
        ctx.beginPath();
        ctx.arc(this.xPos, this.yPos, gridScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.xPos, this.yPos);
        ctx.lineTo(this.xPos + this.x * gridScale, this.yPos + this.y * gridScale);
        ctx.stroke();
        this.onDraw(gridScale);
    }
    steer = false;
    onDraw(gridScale) {
        if (this.steer) {
            const maxAngle = Math.PI / 10;
            const randomSteer = Math.random() * maxAngle;
            this.angle += randomSteer - maxAngle / 2;
        }
        const width = gridScale * 40;
        const height = gridScale * 60;
        this.xPos = (this.xPos + this.x) % width;
        this.yPos = (this.yPos + this.y) % height;
        if (this.xPos < 0) this.xPos = width;
        if (this.yPos < 0) this.yPos = height;
        this.steer = !this.steer;
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
    showGrid = false;
    game;
    mouse = {
        x: 0,
        y: 0
    };
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
    constructor(canvas1, game1){
        this.game = game1;
        this.canvas = canvas1;
        this.setGridScale();
        const ctx = this.canvas.getContext('2d');
        this.context = ctx;
        this.structures = [];
        this.entities = [];
        this.grid = new Map();
        this.buildGridCells();
        this.layers = new Map();
        this.layers.set('units', new Map());
        this.layers.set('overlay', new Map());
        this.canvas.addEventListener('click', (e)=>{
            e.preventDefault();
            for (const clickable of this.clickables){
                clickable.checkIfClicked(this.screenToWorld(e.offsetX, e.offsetY), this.gridScale);
            }
        });
        this.canvas.addEventListener('mousemove', (e)=>{
            const prev = this.mouse;
            this.mouse = {
                x: e.offsetX,
                y: e.offsetY
            };
            if (this.dragging) this.drag(prev);
            let isHovering = false;
            for (const hoverable of this.hoverables){
                if (hoverable.checkHovering(this.screenToWorld(e.offsetX, e.offsetY), this.gridScale)) {
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
            this.dragging = false;
        });
        this.canvas.addEventListener('wheel', (e)=>{
            this.scaleAtMouse(e.deltaY < 0 ? 1.1 : 0.9);
            console.log(this.scale);
            if (this.scale === 1) {
                this.origin.x = 0;
                this.origin.y = 0;
            }
        });
        this.canvas.addEventListener('dblclick', (e)=>{
            e.preventDefault();
            this.scale = 1;
            this.origin.x = 0;
            this.origin.y = 0;
            this.context.setTransform(1, 0, 0, 1, 0, 0);
        });
        this.canvas.addEventListener('mousedown', (e)=>{
            e.preventDefault();
            this.dragging = true;
        });
        this.canvas.addEventListener('mouseup', (e)=>{
            e.preventDefault();
            this.dragging = false;
        });
    }
    scale = 1;
    origin = {
        x: 0,
        y: 0
    };
    worldToScreen(x, y) {
        x = x * this.scale + this.origin.x;
        y = y * this.scale + this.origin.y;
        return {
            x,
            y
        };
    }
    screenToWorld(x, y) {
        x = (x - this.origin.x) / this.scale;
        y = (y - this.origin.y) / this.scale;
        return {
            x,
            y
        };
    }
    scaleAtMouse(scaleBy) {
        this.scale = Math.min(Math.max(this.scale * scaleBy, 1), 4);
        this.origin.x = this.mouse.x - (this.mouse.x - this.origin.x) * scaleBy;
        this.origin.y = this.mouse.y - (this.mouse.y - this.origin.y) * scaleBy;
        this.constrainOrigin();
    }
    dragging = false;
    drag(prev) {
        if (this.scale > 1) {
            const xOffset = this.mouse.x - prev.x;
            const yOffset = this.mouse.y - prev.y;
            this.origin.x += xOffset;
            this.origin.y += yOffset;
            this.constrainOrigin();
        }
    }
    constrainOrigin() {
        this.origin.x = Math.min(Math.max(this.origin.x, -this.canvas.width * this.scale + this.canvas.width), 0);
        this.origin.y = Math.min(Math.max(this.origin.y, -this.canvas.height * this.scale + this.canvas.height), 0);
    }
    buildGridCells() {
        for(let x = 0; x < this.gridSize.x; x++){
            for(let y = 0; y < this.gridSize.y; y++){
                const cell = new Cell(x, y, this);
                this.grid.set(`${x},${y}`, cell);
                this.entities.push(cell);
            }
        }
    }
    setGridScale() {
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
    registerStructure(structure) {
        const strucs = [
            structure,
            ...structure.getAllSubstructures()
        ];
        for (const struc of strucs){
            this.structures.push(struc);
            this.entities.push(struc);
        }
        this.buildGridCells();
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
    drawBG() {
        const img = document.getElementById('background');
        if (img) {
            const imgWidth = img.width;
            const imgHeight = img.height;
            for(let x = 0; x < this.canvas.width; x += imgWidth){
                for(let y = 0; y < this.canvas.height; y += imgHeight){
                    this.context.drawImage(img, x, y);
                }
            }
            this.context.fillStyle = '#00000090';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    draw() {
        this.context.setTransform(this.scale, 0, 0, this.scale, this.origin.x, this.origin.y);
        this.context.shadowColor = '#00000000';
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBG();
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
        this.tempLine.draw(this.context, this.gridScale);
    }
    tempLine = new VectorLine({
        x: 100,
        y: 100
    }, {
        x: 10 * this.gridScale,
        y: 0
    });
    clearCells() {
        for (const cell of this.grid.values()){
            cell.visible = false;
            cell.clearCallbacks();
        }
    }
}
class Cell extends HoverableClickable {
    visible = false;
    callbacks = [];
    board;
    structure;
    occupant;
    actionPenalty = 0;
    constructor(xPos, yPos, board1){
        super({
            xPos,
            yPos,
            width: 1,
            height: 1
        });
        this.fillStyle = "#ffffff30";
        this.strokeStyle = '#00000030';
        this.board = board1;
        for (const structure of board1.structures){
            if (structure.collidesOnGrid(this)) {
                this.structure = structure;
                this.actionPenalty = 1;
            }
        }
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
        if (this.visible) {
            super.draw(ctx, gridScale);
            if (this.actionPenalty) {
                ctx.fillStyle = 'white';
                ctx.font = `${gridScale}px monospace`;
                ctx.fillText(`-${this.actionPenalty}`, this.xPos * gridScale, this.yPos * gridScale + gridScale - gridScale / 10, gridScale);
            }
        }
    }
}
class Game {
    platoons;
    turnNumber;
    board;
    timer;
    activeUnit;
    selectedUnit;
    get activePlatoon() {
        return this.platoons[this.turnNumber % this.platoons.length];
    }
    controls;
    controlContainer;
    actionPointsRemaining = 0;
    constructor(board2){
        this.board = board2;
        this.board.game = this;
        this.platoons = [];
        this.turnNumber = 0;
        this.controls = new Map();
        this.controlContainer = document.getElementById("controls");
        this.timer = setInterval(()=>{
            if (this.board) this.board.draw();
        }, 100 / 6);
    }
    stopGame() {
        clearInterval(this.timer);
    }
    selectUnit(unit) {
        this.selectedUnit?.onDeselect();
        this.selectedUnit = unit;
        unit.onSelect();
        const control = this.controls.get('activate') || new Control();
        control.uuid = 'activate';
        control.changeText('Activate Unit');
        control.setAction((e)=>{
            e.preventDefault();
            this.activateUnit();
            this.unregisterControl('activate');
        });
        this.registerControl(control);
    }
    deselctUnit() {
        this.selectedUnit?.onDeselect();
        this.selectedUnit = undefined;
    }
    activateUnit() {
        this.activeUnit = this.selectedUnit;
        this.actionPointsRemaining = this.activeUnit.actionPoints;
        this.activeUnit?.onActivate();
    }
    registerPlatoon(p) {
        this.platoons.push(p);
        console.log('registering');
        for (const unit of p.units.values()){
            this.board.registerEntitity(unit, 'units');
        }
    }
    registerControl(control) {
        this.controls.set(control.uuid, control);
        this.controlContainer.append(control.element);
    }
    unregisterControl(id) {
        const control = this.controls.get(id);
        if (control) {
            control.remove();
            this.controls.delete(id);
        }
    }
    get gameIsReady() {
        return this.platoons.length > 1;
    }
}
class Control {
    action;
    text;
    uuid;
    element;
    constructor(){
        this.uuid = crypto.randomUUID();
        this.element = document.createElement('button');
    }
    setAction(handler) {
        this.action && this.element.removeEventListener('click', this.action);
        this.action = handler;
        this.element.addEventListener('click', this.action);
    }
    changeText(text) {
        this.text = text;
        this.element.textContent = this.text;
    }
    remove() {
        this.element.remove();
    }
}
const SoundClips = {
    bang: 'bang.mp3',
    blaggard: 'blaggard.mp3',
    boom: 'boom.mp3',
    fight_me: 'fight_me.mp3',
    fite_me: 'fite_me.mp3',
    for_the_emperor: 'for_the_emperor.mp3',
    have_at_ye: 'have_at_ye.mp3',
    kablooie: 'kablooie.mp3',
    ratatatata: 'ratatatata.mp3'
};
const audioHandler = (type)=>{
    const audio = new Audio();
    if (type === 'fight') {
        const fightSounds = [
            'blaggard',
            'fight_me',
            'fite_me',
            'for_the_emperor',
            'have_at_ye'
        ];
        type = fightSounds[Math.floor(Math.random() * fightSounds.length)];
        if (type === 'have_at_ye') console.log("Honestly, I know this probably sounds like Spiff, but I PROMISE it's me");
    }
    if (type === 'shoot') {
        const fightSounds = [
            'bang',
            'boom',
            'kablooie',
            'ratatatata'
        ];
        type = fightSounds[Math.floor(Math.random() * fightSounds.length)];
    }
    audio.src = `${window.location.host.includes('github') ? '/war-roulette/public' : ''}/sounds/${SoundClips[type]}`;
    return audio;
};
class TargetOutline extends Rectangle {
    draw(ctx, gridScale) {
        this.strokeStyle = 'orange';
        this.fillStyle = '#00000000';
        super.draw(ctx, gridScale);
    }
}
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
    game;
    isTargetable = true;
    altitude = 0;
    get absolutePosition() {
        return {
            x: this.xPos * this.board.gridScale + this.board.gridScale / 2,
            y: this.yPos * this.board.gridScale + this.board.gridScale / 2
        };
    }
    standingOn;
    statusColors = {
        active: 'blue',
        selected: 'orange',
        activated: 'slateblue',
        unactivated: 'green',
        dead: 'black'
    };
    platoon;
    activeWeapon;
    constructor(board3, color, platoon, game2){
        super({
            height: 1,
            width: 1,
            xPos: 20,
            yPos: 20
        });
        this.uuid = crypto.randomUUID();
        this.board = board3;
        this.game = game2;
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
        this.statusColors.unactivated = color;
        this.platoon = platoon;
        this.checkAltitude();
    }
    shootAt(unit) {
        console.log("BLAM!");
        audioHandler('shoot').play();
    }
    fight(unit) {
        console.log("HAVE AT YE!");
        audioHandler('fight').play();
    }
    registerActions(actions) {
        if (!this.actions) this.actions = [];
        this.actions = this.actions.concat(actions);
    }
    targetsToUnregister = [];
    validTargets = [];
    draw(ctx, gridScale) {
        this.fillStyle = this.statusColors[this.status];
        ctx.lineWidth = 3;
        super.draw(ctx, gridScale);
    }
    onClick() {
        if (this.status === 'unactivated' && this.game.activePlatoon === this.platoon && !this.game.activeUnit) this.game.selectUnit(this);
        else if (this.game.activeUnit && this.game.activePlatoon !== this.platoon) {
            if (this.isWithinMelee(this.game.activeUnit)) this.game.activeUnit.fight(this);
            else if (this.game.activeUnit.validTargets.includes(this)) this.game.activeUnit.shootAt(this);
        } else if (!this.game.activeUnit) this.game.deselctUnit();
    }
    targetLine;
    onHover() {
        if (this.game.activeUnit && this.game.activeUnit.validTargets.includes(this)) {
            const { x: x1 , y: y1  } = this.game.activeUnit.absolutePosition;
            const { x: x2 , y: y2  } = this.absolutePosition;
            this.targetLine = this.board.registerEntitity(new Line({
                x1,
                x2,
                y1,
                y2
            }), 'overlay');
        }
    }
    offHover() {
        if (this.targetLine) {
            this.board.unregisterEntity('overlay', this.targetLine);
            this.targetLine = '';
        }
    }
    isWithinMelee(unit) {
        const xOffset = Math.abs(this.xPos - unit.xPos);
        const yOffset = Math.abs(this.yPos - unit.yPos);
        return xOffset <= 1 && yOffset <= 1;
    }
    checkValidTargets() {
        this.unregisterTargets();
        for (const unit of this.board.entities.filter((e)=>e instanceof Unit
        )){
            if (unit === this || unit.platoon === this.platoon) continue;
            let targetable = true;
            for (const structure of this.board.structures){
                if (structure.blocksView(unit, this, this.board.gridScale)) {
                    targetable = false;
                    break;
                }
            }
            if (targetable) {
                this.targetsToUnregister.push(this.board.registerEntitity(new TargetOutline(unit), 'overlay'));
                this.validTargets.push(unit);
            }
        }
    }
    unregisterTargets() {
        for (const target of this.targetsToUnregister){
            this.board.unregisterEntity('overlay', target);
        }
        this.targetsToUnregister = [];
        this.validTargets = [];
    }
    checkValidCells() {
        const cells = this.board.grid;
        const gridScale = this.board.gridScale;
        const centerX = this.xPos * gridScale + gridScale / 2;
        const centerY = this.yPos * gridScale + gridScale / 2;
        this.board.clearCells();
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
                        if (this.standingOn) {
                            if (cell.structure?.altitude === this.altitude && this.standingOn === cell.structure) {
                                cell.actionPenalty = 0;
                            } else {
                                cell.actionPenalty = Math.abs((cell.structure?.altitude || 0) - this.altitude);
                            }
                        } else {
                            cell.actionPenalty = cell.structure?.altitude || 0;
                        }
                    }
                }
            }
        }
    }
    moveCallback = (cell)=>{
        if (this.status === 'active' && !cell.occupant) {
            this.board.grid.get(`${this.xPos},${this.yPos}`).occupant = undefined;
            this.xPos = cell.xPos;
            this.yPos = cell.yPos;
            this.checkAltitude();
            this.checkValidTargets();
            this.board.clearCells();
            this.onActivate();
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
        this.board.grid.get(`${this.xPos},${this.yPos}`).occupant = this;
    }
    onRegister() {
        this.checkAltitude();
    }
    onSelect() {
        if (this.status === 'unactivated') {
            this.status = 'selected';
            this.checkValidCells();
            this.checkValidTargets();
        }
    }
    onDeselect() {
        this.status = 'unactivated';
        this.board.clearCells();
        this.unregisterTargets();
    }
    onActivate() {
        this.status = 'active';
        this.checkValidCells();
        this.checkValidTargets();
    }
}
class Platoon {
    units;
    board;
    game;
    constructor(board4, game3, color = 'green'){
        this.units = new Map();
        this.board = board4;
        this.game = game3;
        for(let i = 0; i < 10; i++){
            const unit = new Unit(this.board, color, this, this.game);
            unit.xPos = Math.floor(Math.random() * board4.gridSize.x);
            unit.yPos = Math.floor(Math.random() * board4.gridSize.y);
            this.units.set(unit.uuid, unit);
        }
    }
}
const ccw = (A, B, C)=>(C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
;
const intersect = (A, B, C, D)=>ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D)
;
class Structure extends HoverableClickable {
    fillStyle = 'purple';
    altitude = 1;
    substructures = [];
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
        if (s instanceof Structure) {
            this.fillStyle = s.fillStyle;
            this.altitude = s.altitude;
        }
    }
    onClick() {
        console.log('STRUCTURE CLICKED');
    }
    collidesOnGrid(target) {
        const xOffset = target.xPos - this.xPos;
        const yOffset = target.yPos - this.yPos;
        return xOffset >= 0 && yOffset >= 0 && xOffset < this.width && yOffset < this.height;
    }
    blocksView(target, actor, gridScale) {
        if (target.altitude >= this.altitude && actor.altitude >= this.altitude) return false;
        for (const boundary of this.getBoundaries(gridScale)){
            if (intersect(target.absolutePosition, actor.absolutePosition, ...boundary)) {
                if (boundary[0].x === boundary[1].x) {
                    const targetXOffset = Math.abs(target.absolutePosition.x - boundary[0].x);
                    if (targetXOffset < gridScale && this.hasSubstructure(target.standingOn)) return false;
                    const actorXOffset = Math.abs(actor.absolutePosition.x - boundary[0].x);
                    if (actorXOffset < gridScale && this.hasSubstructure(actor.standingOn)) return false;
                } else if (boundary[0].y === boundary[1].y) {
                    const targetYOffset = Math.abs(target.absolutePosition.y - boundary[0].y);
                    if (targetYOffset < gridScale && this.hasSubstructure(target.standingOn)) return false;
                    const actorYOffset = Math.abs(actor.absolutePosition.y - boundary[0].y);
                    if (actorYOffset < gridScale && this.hasSubstructure(actor.standingOn)) return false;
                }
                return true;
            }
        }
        return false;
    }
    hasSubstructure(struc) {
        return !!struc && (struc === this || this.substructures.some((s)=>s.hasSubstructure(struc)
        ));
    }
    getAllSubstructures() {
        return this.substructures.flatMap((s)=>[
                s,
                ...s.getAllSubstructures()
            ]
        );
    }
    draw(ctx, gridScale) {
        ctx.shadowColor = 'black';
        ctx.shadowBlur = gridScale;
        ctx.shadowOffsetX = gridScale / 3;
        ctx.shadowOffsetY = gridScale / 2;
        this.strokeStyle = 'black';
        super.draw(ctx, gridScale);
        ctx.shadowColor = '#00000000';
    }
}
const canvas = document.querySelector("#game-board");
const board = new Board(canvas);
const twoStory = new Structure({
    xPos: 5,
    yPos: 15,
    width: 15,
    height: 10
});
const secondFloor = new Structure({
    xPos: 5,
    yPos: 15,
    width: 5,
    height: 5
});
secondFloor.fillStyle = '#722872';
secondFloor.altitude = 2;
const sym1 = new Structure(twoStory);
sym1.xPos = board.gridSize.x - twoStory.width - twoStory.xPos;
sym1.yPos = board.gridSize.y - twoStory.height - twoStory.yPos;
const sym1SecondFloor = new Structure(secondFloor);
sym1SecondFloor.xPos = board.gridSize.x - secondFloor.width - secondFloor.xPos;
sym1SecondFloor.yPos = board.gridSize.y - secondFloor.height - secondFloor.yPos;
twoStory.substructures.push(secondFloor);
sym1.substructures.push(sym1SecondFloor);
board.registerStructure(twoStory);
board.registerStructure(sym1);
const small = new Structure({
    xPos: 30,
    yPos: 7,
    width: 7,
    height: 12
});
const sym2 = new Structure(small);
sym2.xPos = board.gridSize.x - small.width - small.xPos;
sym2.yPos = board.gridSize.y - small.height - small.yPos;
board.registerStructure(small);
board.registerStructure(sym2);
const game = new Game(board);
game.registerPlatoon(new Platoon(board, game, 'green'));
game.registerPlatoon(new Platoon(board, game, 'red'));
const gridToggle = document.querySelector('#show-grid');
gridToggle.checked = board.showGrid;
gridToggle.addEventListener('change', function(e) {
    e.preventDefault();
    board.showGrid = !board.showGrid;
    gridToggle.checked = board.showGrid;
});
window.board = board;
canvas.addEventListener('wheel', (e)=>{});
