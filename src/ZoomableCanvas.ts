import { OriginVector, Point } from "./game/geometry/Vector.ts";

export class ZoomableCanvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  private scale = 1;
  dragging = false;
  private origin: Point = {
    x: 0,
    y: 0
  }

  mouse = {
    x: 0,
    y: 0
  }

  private previousTouchLength?: number;

  private touchTimer?: number;

  private hasDoubleTapped = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;

    this.canvas.addEventListener('wheel', (e) => {
      this.scaleAtMouse(e.deltaY < 0 ? 1.1 : .9);
      console.log(this.scale);
      if (this.scale === 1) {
        this.origin.x = 0
        this.origin.y = 0
      }
    })
    this.canvas.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.scale = 1;
      this.origin.x = 0;
      this.origin.y = 0;
      this.context.setTransform(1, 0, 0, 1, 0, 0);
    })
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.dragging = true;
    })
    this.canvas.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.dragging = false;
    })
    this.canvas.addEventListener('mouseleave', (e) => {
      this.dragging = false;
    })
    this.canvas.addEventListener('mousemove', (e) => {
      const prev = this.mouse;
      this.mouse = {
        x: e.offsetX,
        y: e.offsetY
      }
      if (this.dragging) this.drag(prev);
    })

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const t1 = e.touches.item(0);
        if (t1) {
          this.mouse = this.getTouchOffset({
            x: t1.clientX,
            y: t1.clientY
          })
        }
        this.touchTimer = setTimeout(() => {
          this.dragging = true;
        }, 100)
      } else {
        clearTimeout(this.touchTimer);
      }
    });
    this.canvas.addEventListener('touchend', (e) => {
      if (e.touches.length !== 2) {
        this.previousTouchLength = undefined;
      }
      setTimeout(() => {
        this.dragging = e.touches.length === 1;
      }, 0)
      clearTimeout(this.touchTimer);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();

      if (e.touches.length === 2) {
        const t1 = e.touches.item(0);
        const t2 = e.touches.item(1);

        if (t1 && t2) {
          const vect = OriginVector.from(
            this.getTouchOffset({
              x: t1.clientX,
              y: t1.clientY
            }),
            {
              x: t2.clientX,
              y: t2.clientY
            },
          )

          if (this.previousTouchLength) {
            const diff = this.previousTouchLength - vect.length;
            this.scaleAt(vect.halfwayPoint, diff < 0 ? 1.01 : .99);
          }
          this.previousTouchLength = vect.length;
        }
      }

      if (e.touches.length === 1 && this.dragging) {
        const t1 = e.touches.item(0);
        if (t1) {
          const prev = this.mouse;
          this.mouse = this.getTouchOffset({
            x: t1.clientX,
            y: t1.clientY
          })
          this.drag(prev);
        }
      }
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.hasDoubleTapped && e.touches.length === 1) {
        this.hasDoubleTapped = true;
        setTimeout(() => this.hasDoubleTapped = false, 300);
        return false;
      }

      this.context.setTransform(1,0,0,1,0,0);
      this.scale = 1;
      this.origin.x = 0;
      this.origin.y = 0;
    })
  }

  worldToScreen(x: number, y: number) {
    x = x * this.scale + this.origin.x;
    y = y * this.scale + this.origin.y;
    return { x, y }
  }
  screenToWorld(x: number, y: number) {
    x = (x - this.origin.x) / this.scale;
    y = (y - this.origin.y) / this.scale;
    return { x, y }
  }
  scaleAtMouse(scaleBy: number) {
    this.scaleAt({
      x: this.mouse.x,
      y: this.mouse.y
    }, scaleBy)
  }
  scaleAt(p: Point, scaleBy: number) {
    this.scale = Math.min(Math.max(this.scale * scaleBy, 1), 4);
    this.origin.x = p.x - (p.x - this.origin.x) * scaleBy;
    this.origin.y = p.y - (p.y - this.origin.y) * scaleBy;
    this.constrainOrigin()
  }
  drag(prev: Point) {
    if (this.scale > 1) {
      const xOffset = this.mouse.x - prev.x;
      const yOffset = this.mouse.y - prev.y;
      this.origin.x += xOffset;
      this.origin.y += yOffset;
      this.constrainOrigin();
    }
  }
  constrainOrigin() {
    this.origin.x = Math.min(Math.max(this.origin.x, (-this.canvas.width * this.scale) + this.canvas.width), 0);
    this.origin.y = Math.min(Math.max(this.origin.y, (-this.canvas.height * this.scale) + this.canvas.height), 0);
  }

  draw() {
    this.context.setTransform(this.scale, 0, 0, this.scale, this.origin.x, this.origin.y)
  }

  getTouchOffset(p: Point) {
    const { x, y } = this.canvas.getBoundingClientRect();
    const offsetX = p.x - x;
    const offsetY = p.y - y;

    return {
      x: offsetX,
      y: offsetY
    }
  }
}