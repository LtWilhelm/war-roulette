import { IShape } from "../drawables/Shape.ts";

export class Vector {
  // origin: Point;
  x: number;
  y: number;
  private _angle: number;
  private _length: number;

  get length() {
    return Math.sqrt(
      (this.x ** 2) + (this.y ** 2)
    )
  }
  set length(length: number) {
    this._length = length;
    this.calculateXY();
  }

  get angle() {
    this._angle = Math.atan2(this.x, this.y);
    return this._angle;
  }
  set angle(angle: number) {
    this._angle = angle;
    this.calculateXY();
  }

  private calculateXY() {
    this.x = this._length * Math.sin(this._angle);
    this.y = this._length * Math.cos(this._angle);
  }

  constructor(vector: Point, origin?: Point) {
    this.x = vector.x;
    this.y = vector.y;

    this._length = this.length;
    this._angle = this.angle
    // if (origin) this.origin = origin;
    // else this.origin = {x: 0, y: 0};
  }

  static from(p1: Pointlike, p2: Pointlike) {
    const point: Point = {
      x: (p1.x || p1.xPos || 1) - (p2.x || p2.xPos || 1),
      y: (p1.y || p1.yPos || 1) - (p2.y || p2.yPos || 1),
    }
    return new Vector(point);
  }
}

export interface Point {
  x: number;
  y: number;
}

interface Pointlike extends Partial<Point> {
  xPos?: number;
  yPos?: number;
}

// export class Point {
//   x: number;
//   y: number;
//   constructor(p: Point) {
//     this.x = p.x;
//     this.y = p.y;
//   }
// }

export class VectorLine extends Vector implements IShape {
  xPos: number;
  yPos: number;
  // constructor(p: Point, ) {

  // }
  constructor(p: Point, v: Point) {
    super(v);
    this.xPos = p.x;
    this.yPos = p.y;
    this.length = 1;
  }
  draw(ctx: CanvasRenderingContext2D, gridScale: number) {
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'grey';
    ctx.shadowColor = 'blue';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.arc(this.xPos, this.yPos, gridScale, 0, Math.PI*2)
    ctx.stroke();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.xPos, this.yPos);
    ctx.lineTo(this.xPos + (this.x * gridScale), this.yPos + (this.y * gridScale));
    ctx.stroke();
    this.onDraw(gridScale);
  }

  steer = false;
  onDraw(gridScale: number) {
    if (this.steer) {
      const maxAngle = Math.PI / 10;
      const randomSteer = Math.random() * maxAngle;
      this.angle += randomSteer - (maxAngle / 2);
    }
    const width = gridScale * 40;
    const height = gridScale * 60;
    this.xPos = (this.xPos + this.x) % (width);
    this.yPos = (this.yPos + this.y) % (height);
    
    if (this.xPos < 0) this.xPos = width;
    if (this.yPos < 0) this.yPos = height;
    this.steer = !this.steer;
  }
}