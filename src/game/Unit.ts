import { Board, Cell } from "./Board.ts";
import { TargetOutline } from "./entities/Targetting.ts";
import { HoverableClickable } from "./HoverableClickable.ts";
import { coord } from "./Intersections.ts";
import { Structure } from "./Structure.ts";

const statusColors = {
  opponent: 'darkred',
  active: 'blue',
  activated: 'slateblue',
  unactivated: 'green',
  dead: 'black'
}

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

  status: keyof typeof statusColors;

  board: Board;

  isTargetable = true;

  altitude = 0;
  get absolutePosition(): coord {
    return {
      x: this.xPos * this.board.gridScale + (this.board.gridScale / 2),
      y: this.yPos * this.board.gridScale + (this.board.gridScale / 2),
    }
  }

  standingOn?: Structure;

  constructor(board: Board) {
    super({
      height: 1,
      width: 1,
      xPos: 20,
      yPos: 20,
    })

    this.uuid = crypto.randomUUID();

    this.board = board;
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

    this.checkAltitude();
  }

  shootAt(u: Unit, weapon: number) {

  }

  registerActions(actions: Function[]) {
    if (!this.actions) this.actions = [];

    this.actions = this.actions.concat(actions);
  }

  validTargets: coord[] = [];

  draw(ctx: CanvasRenderingContext2D, gridScale: number) {
    // testUnit.draw(ctx, gridScale);
    this.fillStyle = statusColors[this.status];
    ctx.lineWidth = 3;
    super.draw(ctx, gridScale);
    if (this.status === 'active') {
      ctx.beginPath();
      const startingX = this.xPos * gridScale + (gridScale / 2);
      const startingY = this.yPos * gridScale + (gridScale / 2);
      ctx.arc(startingX, startingY, this.speed * gridScale + (gridScale / 2), 0, Math.PI * 2);
      ctx.stroke();
      // this.checkValidCells(gridScale);

      for (const target of this.validTargets) {
        const { x, y } = this.absolutePosition;
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
    for (const unit of (this.board.entities.filter(e => e instanceof Unit) as Unit[])) {
      if (unit.xPos === this.xPos && unit.yPos === this.yPos) continue;
      let targetable = true;
      for (const structure of this.board.structures) {
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
    const centerX = this.xPos * gridScale + (gridScale / 2);
    const centerY = this.yPos * gridScale + (gridScale / 2);

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
}

function v4(): string {
throw new Error("Function not implemented.");
}
