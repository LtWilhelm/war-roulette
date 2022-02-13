import { Rectangle } from "../drawables/Shape.ts";

export class TargetOutline extends Rectangle {
  draw(ctx:CanvasRenderingContext2D, gridScale: number) {
    this.strokeStyle = 'orange';
    this.fillStyle = '#00000000';
    super.draw(ctx, gridScale);
  }
}