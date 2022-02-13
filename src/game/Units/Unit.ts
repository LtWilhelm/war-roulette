import { Board, Cell } from "../Board.ts";
import { Line } from "../drawables/Shape.ts";
import { TargetOutline } from "../entities/Targetting.ts";
import { Game } from "../Game.ts";
import { HoverableClickable } from "../HoverableClickable.ts";
import { coord } from "../Intersections.ts";
import { Platoon } from "../Platoon.ts";
import { Structure } from "../Structure.ts";

export class Unit extends HoverableClickable {
  health: number;
  speed: number;

  uuid: string;

  // shootingSkill is a multiplier that determines how likely a shot is to hit, between 0 and 1
  shootingSkill: number;
  // fightingSkill is a multiplier that compares with opponent fighting skill, between 0 and 1
  fightingSkill: number;

  // armor is a divisor that applies to all incoming attacks
  armor: number;
  // agility is a divisor that applies to melee attacks. Some units may be "hyper agile" meaning their agility is applied in shooting attacks as well
  agility: number;
  isHyperAgile: boolean;

  actionPoints: number;

  equipment: [];

  actions?: Function[];

  status: keyof typeof this.statusColors;

  board: Board;
  game: Game;

  isTargetable = true;

  altitude = 0;
  get absolutePosition(): coord {
    return {
      x: this.xPos * this.board.gridScale + (this.board.gridScale / 2),
      y: this.yPos * this.board.gridScale + (this.board.gridScale / 2),
    }
  }

  standingOn?: Structure;

  statusColors = {
    active: 'blue',
    selected: 'orange',
    activated: 'slateblue',
    unactivated: 'green',
    dead: 'black'
  }

  platoon: Platoon;

  activeWeapon?: any;

  constructor(board: Board, color: string, platoon: Platoon, game: Game) {
    super({
      height: 1,
      width: 1,
      xPos: 20,
      yPos: 20,
    })

    this.uuid = crypto.randomUUID();

    this.board = board;
    this.game = game;
    this.status = 'unactivated';

    this.health = 10;
    this.speed = 10;

    this.shootingSkill = .5;
    this.fightingSkill = .5;
    this.armor = 1;
    this.agility = 1;
    this.isHyperAgile = false;

    this.actionPoints = 3;
    this.equipment = [];

    this.statusColors.unactivated = color;
    this.platoon = platoon;

    this.checkAltitude();
  }

  shootAt(unit: Unit) {

  }

  fight(unit: Unit) {

  }

  registerActions(actions: Function[]) {
    if (!this.actions) this.actions = [];

    this.actions = this.actions.concat(actions);
  }

  targetsToUnregister: string[] = [];
  validTargets: Unit[] = [];

  draw(ctx: CanvasRenderingContext2D, gridScale: number) {
    // testUnit.draw(ctx, gridScale);
    this.fillStyle = this.statusColors[this.status];
    ctx.lineWidth = 3;
    super.draw(ctx, gridScale);
  }

  onClick() {
    if (this.status === 'unactivated' && this.game.activePlatoon === this.platoon)
      this.game.selectUnit(this);
    else if (this.game.activeUnit && this.game.activePlatoon !== this.platoon) {
      if (this.isWithinMelee(this.game.activeUnit)) this.game.activeUnit.fight(this);
      else if (this.game.activeUnit.validTargets.includes(this)) this.game.activeUnit.shootAt(this);
    } else this.game.deselctUnit();
  }

  targetLine?: string;
  onHover() {
    if (this.game.activeUnit && this.game.activeUnit.validTargets.includes(this)) {
      const {x:x1,y:y1} = this.game.activeUnit.absolutePosition;
      const {x: x2, y: y2} = this.absolutePosition;
      this.targetLine = this.board.registerEntitity(new Line({x1,x2,y1,y2}), 'overlay');
    }
  }
  offHover() {
    if (this.targetLine) {
      this.board.unregisterEntity('overlay',this.targetLine);
      this.targetLine = ''
    }
  }

  isWithinMelee(unit: Unit) {
    const xOffset = Math.abs(this.xPos - unit.xPos);
    const yOffset = Math.abs(this.yPos - unit.yPos);
    return (xOffset <= 1 && yOffset <= 1);
  }

  checkValidTargets() {
    this.unregisterTargets();

    for (const unit of (this.board.entities.filter(e => e instanceof Unit) as Unit[])) {
      if (
        unit === this ||
        unit.platoon === this.platoon
      ) continue;
      let targetable = true;
      for (const structure of this.board.structures) {
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
    for (const target of this.targetsToUnregister) {
      this.board.unregisterEntity('overlay', target);
    }

    this.targetsToUnregister = [];
    this.validTargets = [];
  }

  checkValidCells() {
    const cells = this.board.grid;
    const gridScale = this.board.gridScale;
    const centerX = this.xPos * gridScale + (gridScale / 2);
    const centerY = this.yPos * gridScale + (gridScale / 2);

    this.board.clearCells();

    for (let x = this.xPos - this.speed; x <= this.xPos + this.speed; x++) {
      let xCoord = 0;
      if (x > this.xPos) xCoord = x * gridScale;
      else if (x < this.xPos) xCoord = (x + 1) * gridScale;
      else xCoord = x * gridScale + (gridScale / 2);
      for (let y = this.yPos - this.speed; y <= this.yPos + this.speed; y++) {
        let yCoord = 0;
        if (y > this.yPos) yCoord = y * gridScale;
        else if (y < this.yPos) yCoord = (y + 1) * gridScale;
        else yCoord = y * gridScale + (gridScale / 2);

        const xOffset = centerX - xCoord;
        const yOffset = centerY - yCoord;

        const maxDistance = this.speed * gridScale + (gridScale / 2);
        // console.log(x, y);

        if ((xOffset * xOffset) + (yOffset * yOffset) < (maxDistance * maxDistance) && (x !== this.xPos || y !== this.yPos)) {
          const cell = cells.get(`${x},${y}`);
          if (cell) {
            cell.visible = true;
            cell.addCallback(this.moveCallback)
          }
        }
      }
    }
  }

  moveCallback = (cell: Cell) => {
    if (this.status === 'active') {
      this.xPos = cell.xPos;
      this.yPos = cell.yPos;
      this.checkAltitude();
      this.checkValidTargets();
      // this.status = 'activated';
      for (const cell of this.board.grid.values()) {
        cell.visible = false;
        cell.clearCallbacks();
      }
    }
  }

  checkAltitude() {
    let maxAltitude = 0
    let standingOn;
    for (const structure of this.board.structures) {
      const xOffset = this.xPos - structure.xPos;
      const yOffset = this.yPos - structure.yPos;
      if (
        xOffset >= 0 &&
        yOffset >= 0 &&
        xOffset < structure.width &&
        yOffset < structure.height
      ) {
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
  }
}
