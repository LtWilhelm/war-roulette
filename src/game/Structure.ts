import { HoverableClickable } from "./HoverableClickable.ts";
import { coord, intersect } from "./Intersections.ts";
import { Rectangle } from "./drawables/Shape.ts";
import { Unit } from "./Units/Unit.ts";

interface IStructure {
  xPos: number;
  yPos: number;
  width: number;
  height: number;
}
// TODO structures should extend rectangles
export class Structure extends HoverableClickable implements IStructure {
  fillStyle = 'purple';
  altitude = 1;

  getBoundaries(gridScale: number): [coord, coord][] {
    const xPos = this.xPos * gridScale;
    const yPos = this.yPos * gridScale;
    const width = this.width * gridScale;
    const height = this.height * gridScale;
    return [
      [
        {
          x: xPos,
          y: yPos,
        },
        {
          x: xPos + width,
          y: yPos,
        },
      ],
      [
        {
          x: xPos,
          y: yPos + height,
        },
        {
          x: xPos + width,
          y: yPos + height,
        },
      ],
      [
        {
          x: xPos,
          y: yPos,
        },
        {
          x: xPos,
          y: yPos + height,
        },
      ],
      [
        {
          x: xPos + width,
          y: yPos,
        },
        {
          x: xPos + width,
          y: yPos + height,
        },
      ],
    ]
  }

  constructor(s: IStructure | Structure) {
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

  // onHover() {
  //   // this.fillStyle = 'red';
  // }
  // offHover() {
  //   this.fillStyle = 'purple';
  // }

  onClick() {
    console.log('STRUCTURE CLICKED');
  }

  // TODO additional check to see if larger rectangles collide
  collidesOnGrid(target: Rectangle) {
    const xOffset = target.xPos - this.xPos;
    const yOffset = target.yPos - this.yPos;
    return (
      xOffset >= 0 &&
      yOffset >= 0 &&
      xOffset < this.width &&
      yOffset < this.height
    )
  }

  blocksView(target: Unit, actor: Unit, gridScale: number) {
    if (target.altitude >= this.altitude && actor.altitude >= this.altitude) return false;

    for (const boundary of this.getBoundaries(gridScale)) {
      if (intersect(target.absolutePosition, actor.absolutePosition, ...boundary)) {
        if (boundary[0].x === boundary[1].x) {
          const targetXOffset = Math.abs(target.absolutePosition.x - boundary[0].x);
          if (
            (targetXOffset < gridScale) &&
            target.standingOn?.includes(this)
          ) return false;
          const actorXOffset = Math.abs(actor.absolutePosition.x - boundary[0].x);
          if (
            (actorXOffset < gridScale) &&
            actor.standingOn?.includes(this)
          ) return false;
        } else if (boundary[0].y === boundary[1].y) {
          const targetYOffset = Math.abs(target.absolutePosition.y - boundary[0].y);
          if (
            (targetYOffset < gridScale) &&
            target.standingOn?.includes(this)
          ) return false;
          const actorYOffset = Math.abs(actor.absolutePosition.y - boundary[0].y);
          if (
            (actorYOffset < gridScale) &&
            actor.standingOn?.includes(this)
          ) return false;
        }
        return true;
      }
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D, gridScale: number) {
    ctx.shadowColor = 'black';
    ctx.shadowBlur = gridScale;
    ctx.shadowOffsetX = gridScale/3;
    ctx.shadowOffsetY = gridScale/2;
    this.strokeStyle= 'black'
    super.draw(ctx, gridScale);
    ctx.shadowColor = '#00000000'
  }
}