import { HoverableClickable } from "./HoverableClickable.ts";
import { coord, intersect } from "./Intersections.ts";
import { Rectangle } from "./Shape.ts";
import { Unit } from "./Unit.ts";

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

  constructor(s: IStructure) {
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

  // TODO additional check to see if larger rectangles collide
  collidesOnGrid(target: Rectangle) {
    const xOffset = target.xPos = this.xPos;
    const yOffset = target.yPos = this.yPos;
    return (xOffset >= 0 && yOffset >= 0 && xOffset < this.width && yOffset < this.height);
  }

  blocksView(target: Unit, actor: Unit, gridScale: number) {
    if (target.altitude >= this.altitude && actor.altitude >= this.altitude) return false;

    for (const boundary of this.getBoundaries(gridScale)) {
      if (intersect(target.absolutePosition, actor.absolutePosition, ...boundary)) {
        if (boundary[0].x === boundary[1].x) {
          const targetXOffset = Math.abs(target.absolutePosition.x - boundary[0].x);
          if (
            (targetXOffset < gridScale && target.altitude === this.altitude) &&
            this.collidesOnGrid(target)
          ) return false;
          const actorXOffset = Math.abs(actor.absolutePosition.x - boundary[0].x);
          if (
            (actorXOffset < gridScale && actor.altitude === this.altitude) &&
            this.collidesOnGrid(actor)
          ) return false;
        } else if (boundary[0].y === boundary[1].y) {
          const targetYOffset = Math.abs(target.absolutePosition.y - boundary[0].y);
          if (
            (targetYOffset < gridScale && target.altitude === this.altitude) &&
            this.collidesOnGrid(target)
          ) return false;
          const actorYOffset = Math.abs(actor.absolutePosition.y - boundary[0].y);
          if (
            (actorYOffset < gridScale && actor.altitude === this.altitude) &&
            this.collidesOnGrid(actor)
          ) return false;
        }
        return true;
      }
    }
    return false;
  }
}