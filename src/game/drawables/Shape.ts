export interface IShape {
  xPos: number;
  yPos: number;

  draw: (ctx: CanvasRenderingContext2D, gridScale: number) => void;
  // checkBounds: (shape: IShape) => boolean;
}

export class Circle implements IShape {
  xPos: number;
  yPos: number;

  radius: number;

  constructor(c: Circle) {
    this.xPos = c?.xPos;
    this.yPos = c?.yPos;
    this.radius = c.radius;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'purple';
    // ctx.translate(this.xPos, this.yPos);
    ctx.beginPath();
    ctx.arc(this.xPos, this.yPos, this.radius, 0, Math.PI * 2);
    ctx.closePath();
  }
}

interface IRectangle {
  xPos: number;
  yPos: number;
  width: number;
  height: number;
}
export class Rectangle implements IShape {
  xPos: number;
  yPos: number;
  width: number;
  height: number;

  fillStyle = 'green';
  strokeStyle = '#00000000'

  constructor(r: IRectangle) {
    this.xPos = r.xPos;
    this.yPos = r.yPos;
    this.width = r.width;
    this.height = r.height;
  }

  draw(ctx: CanvasRenderingContext2D, gridScale: number) {
    ctx.fillStyle = this.fillStyle;
    ctx.strokeStyle = this.strokeStyle;
    // ctx.lineWidth = 5
    
    ctx.fillRect(this.xPos * gridScale, this.yPos * gridScale, this.width * gridScale, this.height * gridScale);
    ctx.shadowColor = '#00000000'
    ctx.strokeRect(this.xPos * gridScale, this.yPos * gridScale, this.width * gridScale, this.height * gridScale);
  }
}

interface ILine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class Line implements IShape, ILine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  xPos: number;
  yPos: number;

  strokeStyle: string;

  constructor(l: ILine, color = 'white') {
    this.x1 = l.x1;
    this.y1 = l.y1;
    this.x2 = l.x2
    this.y2 = l.y2
    
    this.xPos = ((l.x1 + l.x2)/2)
    this.yPos = ((l.y1 + l.y2)/2)

    this.strokeStyle = color;
  }
  
  draw(ctx: CanvasRenderingContext2D, gridScale: number) {
    ctx.strokeStyle = this.strokeStyle; 
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
  }
}
