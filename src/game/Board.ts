import { Clickable, Hoverable, IClickable, IHoverable, HoverableClickable } from "./HoverableClickable.ts";
import { Game } from "./index.ts";
import { IShape, Rectangle } from "./drawables/Shape.ts";
import { Structure } from "./Structure.ts";
import { uuidV4 } from "../lib/uuidV4.ts";

interface drawable extends IShape {
  onRegister?(): void;
}

type layer = Map<string, IShape>;

type layers = Map<string, layer>;

export class Board {
  private canvas: HTMLCanvasElement;

  private context: CanvasRenderingContext2D;

  structures: Structure[];
  entities: any[];

  layers: layers;

  grid: Map<string, Cell>;

  gridSize = { x: 40, y: 60 };
  private _gridScale = 20;
  get gridScale() { return this._gridScale }

  showGrid = true;

  game?: Game;

  get hoverables(): IHoverable[] {
    return this.entities.filter(e => {
      if(e.checkHovering) {
        if (e instanceof Cell) {
          return e.visible;
        }
        return true;
      }
    });
  }

  get clickables(): IClickable[] {
    return this.entities.filter(e => e.checkIfClicked);
  }

  constructor(canvas: HTMLCanvasElement, game?: Game) {
    this.game = game;
    this.canvas = canvas;

    this.setCanvasScale();

    const ctx = this.canvas.getContext('2d');
    this.context = ctx!;

    this.structures = [];
    this.entities = [];
    // this.drawables = [];
    this.layers = new Map();
    this.layers.set('units', new Map());
    this.layers.set('overlay', new Map());

    this.canvas.addEventListener('click', (ev) => {
      ev.preventDefault();

      for (const clickable of this.clickables) {
        clickable.checkIfClicked(ev.offsetX / this.gridScale, ev.offsetY / this.gridScale);
      }
    })

    this.canvas.addEventListener('mousemove', (e) => {
      // console.log(e.offsetX, e.offsetY);
      let isHovering = false;
      for (const hoverable of this.hoverables) {
        if (hoverable.checkHovering(e.offsetX / this.gridScale, e.offsetY / this.gridScale)) {
          isHovering = true;
        }
      }
      if (isHovering) this.canvas.style.cursor = "pointer";
      else this.canvas.style.cursor = "default";
    })

    this.canvas.addEventListener('mouseleave', () => {
      for (const hoverable of this.hoverables) {
        hoverable.offHover();
      }
      this.canvas.style.cursor = "default";
    })

    this.grid = new Map();
    for (let x = 0; x < this.gridSize.x; x++) {
      for (let y = 0; y < this.gridSize.y; y++) {
        const cell = new Cell(x, y);
        this.grid.set(`${x},${y}`, cell);
        this.entities.push(cell);
      }
    }
  }

  setCanvasScale() {
    let width = Math.min((this.gridSize.x * this.gridScale), this.canvas.parentElement!.clientWidth);
    let height = this.gridSize.y * this.gridScale;

    if (this.canvas.parentElement!.clientWidth < this.canvas.parentElement!.clientHeight) {
      width -= (width % this.gridSize.x)

      this._gridScale = width / this.gridSize.x;

      height = this.gridSize.y * this.gridScale;
    } else {
      height = Math.min((this.gridSize.y * this.gridScale), this.canvas.parentElement!.clientHeight);
      height -= (width % this.gridSize.y);

      this._gridScale = height / this.gridSize.y;

      width = this.gridSize.x * this.gridScale;
    }

    console.log(width, height);

    this.canvas.width = width;
    this.canvas.height = height;
  }

  registerStructure(struc: Structure, symmetrical = false) {
    this.structures.push(struc);
    this.entities.push(struc);
    if (symmetrical) {
      const sym = new Structure({
        ...struc,
        xPos: this.gridSize.x - struc.width - struc.xPos,
        yPos: this.gridSize.y - struc.height - struc.yPos,
      })
      this.structures.push(sym);
      this.entities.push(sym);
    }
  }

  registerEntitity<T extends drawable>(ent: T, layerId: string) {
    this.entities.push(ent);
    if (ent.onRegister) ent.onRegister();
    if (layerId) {
      const layer = this.layers.get(layerId);
      if (layer) {
        const id = uuidV4()
        layer.set(id, ent);
        return id;
      }
    }
  }
  unregisterEntity(layerId: string, id: string) {
    const layer = this.layers.get(layerId);
    if (layer) layer.delete(id);
  }

  draw() {
    // this.context.fillStyle = 'black';
    // this.context.fillRect(0,0,this.canvas.width, this.canvas.height);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const structure of this.structures) {
      structure.draw(this.context, this.gridScale);
    }

    // Draw valid cells
    for (const cell of this.grid.values()) {
      cell.draw(this.context, this.gridScale);
    }

    // Draw additional entities
    for (const layer of this.layers.values()) {
      for (const drawable of layer.values()) {
        drawable.draw(this.context, this.gridScale);
      }
    }

    // Draw grid
    if (this.showGrid) {
      this.context.strokeStyle = '#ffffff50';
      this.context.lineWidth = 1;
      this.context.beginPath();
      for (let x = 0; x < this.canvas.width; x += this.gridScale) {
        this.context.moveTo(x, 0);
        this.context.lineTo(x, this.canvas.height);
      }
      for (let y = 0; y < this.canvas.height; y += this.gridScale) {
        this.context.moveTo(0, y);
        this.context.lineTo(this.canvas.width, y);
      }

      this.context.stroke();
    }
  }
}

export class Cell extends HoverableClickable {
  visible = false;
  callbacks: ((cell: Cell) => void)[] = [];

  constructor(xPos: number, yPos: number) {
    super({
      xPos,
      yPos,
      width: 1,
      height: 1
    })
    this.fillStyle = "#ffffff30";
    this.strokeStyle = '#ffffff30';
  }

  offHover() {
    this.fillStyle = "#ffffff30";
  }
  onHover() {
    this.fillStyle = "#fffffff0";
  }

  onClick() {
    if (this.visible) {
      console.log(this.xPos, this.yPos);
      for (const callback of this.callbacks) {
        callback(this);
      }
      this.callbacks = [];
    }
  }

  addCallback(cb: (cell: Cell) => void) {
    this.callbacks.push(cb);
  }

  clearCallbacks() {
    this.callbacks = [];
  }

  draw(ctx: CanvasRenderingContext2D, gridScale: number) {
    // this.visible = !this.visible;

    if (this.visible)
      super.draw(ctx, gridScale);
  }
}
