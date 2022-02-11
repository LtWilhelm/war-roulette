export class Board {
  private canvas: HTMLCanvasElement;
  
}

export class Structure {
  xPos: number;
  yPos: number;
  width: number;
  height: number;

  constructor(s: Structure) {
    this.xPos = s.xPos;
    this.yPos = s.yPos;
    this.width = s.width;
    this.height = s.height;
  }
}