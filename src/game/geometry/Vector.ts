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

  constructor(vector: Point) {
    this.x = vector.x;
    this.y = vector.y;

    this._length = this.length;
    this._angle = this.angle;
  }

  add(v: Vector) {
    this.x = v.x + this.x;
    this.y = v.y + this.y;
  }

  static from(p1: Pointlike, p2: Pointlike) {
    const point: Point = {
      x: (p1.x || p1.xPos || 1) - (p2.x || p2.xPos || 1),
      y: (p1.y || p1.yPos || 1) - (p2.y || p2.yPos || 1),
    }
    return new Vector(point);
  }
}

export class OriginVector extends Vector {
  origin: Point;

  get halfwayPoint() {
    return {
      x: (this.length/2 * Math.sin(this.angle)) + this.origin.x,
      y: (this.length/2 * Math.cos(this.angle)) + this.origin.y
    }
  }

  constructor(origin: Point, p: Point) {
    super(p);
    this.origin = origin;
  }

  static from(origin: Point, p: Point) {
    const v = {
      x: p.x - origin.x,
      y: p.y - origin.y
    };

    return new OriginVector(origin, v);
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
    const width = (gridScale * 40) + gridScale;
    const height = (gridScale * 60) + gridScale;
    this.xPos = (this.xPos + this.x) % (width);
    this.yPos = (this.yPos + this.y) % (height);
    
    if (this.xPos < -gridScale) this.xPos = width;
    if (this.yPos < -gridScale) this.yPos = height;
    this.steer = !this.steer;
  }
}