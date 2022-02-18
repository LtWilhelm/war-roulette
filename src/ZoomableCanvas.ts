import { OriginVector, Point } from "./game/geometry/Vector.ts";
import { easeInOut } from "./timing/EaseInOut.ts";
import { map } from "./timing/Map.ts";

type TouchEventCallback = (e: TouchEvent) => void;
const maxZoomScale = 4;

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
  private zooming = false;
  scaleAround: Point = { x: 0, y: 0 };
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;

    this.canvas.addEventListener('wheel', (e) => {
      this.scaleAtMouse(e.deltaY < 0 ? 1.1 : .9);
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
        // this.touchTimer = setTimeout(() => {
        //   this.dragging = true;
        // }, 100)
      } else {
        clearTimeout(this.touchTimer);
      }
    });
    this.canvas.addEventListener('touchend', (e) => {
      if (e.touches.length !== 2) {
        this.previousTouchLength = undefined;
      }

      switch (e.touches.length) {
        case 1:
          break;
        case 0:
          if (!this.zooming) {
            this.events.get('touchend')?.map(cb => cb(e));
          }
          break;
      }

      this.dragging = e.touches.length === 1;
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

      if (e.touches.length === 1) {
        this.dragging === true;
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
      if (e.touches.length !== 1) return false;

      if (!this.hasDoubleTapped) {
        this.hasDoubleTapped = true;
        setTimeout(() => this.hasDoubleTapped = false, 300);
        return false;
      }

      // this.context.setTransform(1, 0, 0, 1, 0, 0);
      // this.scale = 1;
      // this.origin.x = 0;
      // this.origin.y = 0;

      console.log(this.mouse);

      if (this.scale > 1) {
        this.frameCounter = map(this.scale, maxZoomScale, 1, 0, 59);
        this.zoomDirection = -1;
      } else {
        this.frameCounter = 0;
        this.zoomDirection = 1;
      }
      if (this.zoomDirection > 0)
        this.scaleAround = { ...this.mouse };
        
      this.events.get('doubletap')?.map(cb => cb(e));
    })
  }

  worldToScreen(x: number, y: number) {
    x = x * this.scale + this.origin.x;
    y = y * this.scale + this.origin.y;
    return { x, y };
  }
  screenToWorld(x: number, y: number) {
    x = (x - this.origin.x) / this.scale;
    y = (y - this.origin.y) / this.scale;
    return { x, y };
  }
  scaleAtMouse(scaleBy: number) {
    if (this.scale === 4 && scaleBy > 1) return;
    this.scaleAt({
      x: this.mouse.x,
      y: this.mouse.y
    }, scaleBy);
  }
  scaleAt(p: Point, scaleBy: number) {
    this.scale = Math.min(Math.max(this.scale * scaleBy, 1), maxZoomScale);
    this.origin.x = p.x - (p.x - this.origin.x) * scaleBy;
    this.origin.y = p.y - (p.y - this.origin.y) * scaleBy;
    this.constrainOrigin();
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
    this.animateZoom();
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

  zoomDirection = -1;
  frameCounter = 60;
  animateZoom() {
    if (this.frameCounter < 60) {
      const frame = easeInOut(map(this.frameCounter, 0, 59, 0, 1));
      // this.scaleAtMouse(1.000001);
      // console.log(this.origin);
      switch (this.zoomDirection) {
        case 1: {
          this.scale = map(frame, 0, 1, 1, maxZoomScale);

          // this.origin.x = this.mouse.x - (this.mouse.x * this.scale);
          // this.origin.y = this.mouse.y - (this.mouse.y * this.scale);
        }
          break;
        case -1: {
          // const oldScale = this.scale;
          // const totalWidthPc = this.origin.x/(this.canvas.width * this.scale) || 1;
          // const totalHeightPc = this.origin.y/(this.canvas.height * this.scale) || 1;
          this.scale = map(frame, 0, 1, maxZoomScale, 1);
          // this.mouse = {
          //   x: (this.mouse.x + (this.canvas.width/2))/2,
          //   y: (this.mouse.y + (this.canvas.height/2))/2
          // }
          // const xShrinkage = (this.canvas.width * this.scale) - (this.canvas.width * oldScale);
          // const yShrinkage = (this.canvas.height * this.scale) - (this.canvas.height * oldScale);
          // this.origin.x += xShrinkage * totalWidthPc;
          // this.origin.y += yShrinkage * totalHeightPc;
        }
          break;
      }
      this.origin.x = this.scaleAround.x - (this.scaleAround.x * this.scale);
      this.origin.y = this.scaleAround.y - (this.scaleAround.y * this.scale);
      this.constrainOrigin();

      this.frameCounter++;
    }
  }

  events: Map<string, TouchEventCallback[]> = new Map();
  registerEvent(eventName: 'touchend' | 'touchstart' | 'touchmove' | 'doubletap', cb: TouchEventCallback) {
    let events = this.events.get(eventName);
    if (!events) events = this.events.set(eventName, []).get(eventName)!;
    events.push(cb);
  }
}

