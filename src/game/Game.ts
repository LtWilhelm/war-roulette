import { Board } from "./Board.ts";
import { Platoon } from "./Platoon.ts";
import { Unit } from "./Units/Unit.ts";

export class Game {
  platoons: Platoon[];
  turnNumber: number;

  board: Board;

  timer?: number;

  activeUnit?: Unit;
  selectedUnit?: Unit;
  get activePlatoon() {
    return this.platoons[this.turnNumber % this.platoons.length]
  }

  controls: Map<string, Control>;
  controlContainer: HTMLDivElement;

  actionPointsRemaining = 0;

  constructor(board: Board) {
    this.board = board;
    this.board.game = this;

    this.platoons = [];
    this.turnNumber = 0;

    this.controls = new Map();
    this.controlContainer = document.getElementById("controls") as HTMLDivElement;

    setTimeout(() => {
      this.timer = setInterval(() => {
        if (this.board)
          this.board.draw();
      }, (100 / 6));
    }, 1000)
  }

  stopGame() {
    clearInterval(this.timer);
  }

  selectUnit(unit: Unit) {
    this.selectedUnit?.onDeselect();
    this.selectedUnit = unit;
    unit.onSelect();

    const control = this.controls.get('activate') || new Control();
    control.uuid = 'activate'
    control.changeText('Activate Unit');
    control.setAction((e) => {
      e.preventDefault();
      this.activateUnit();
      this.unregisterControl('activate');
    });
    this.registerControl(control);
  }
  deselctUnit() {
    this.selectedUnit?.onDeselect();
    this.selectedUnit = undefined;
  }

  activateUnit() {
    this.activeUnit = this.selectedUnit;
    this.actionPointsRemaining = this.activeUnit!.actionPoints;
    this.activeUnit?.onActivate();
  }

  registerPlatoon(p: Platoon) {
    this.platoons.push(p);
    console.log('registering');
    for (const unit of p.units.values()) {
      this.board.registerEntitity(unit, 'units');
    }
  }

  registerControl(control: Control) {
    this.controls.set(control.uuid, control);
    this.controlContainer.append(control.element);
  }
  unregisterControl(id: string) {
    const control = this.controls.get(id);
    if (control) {
      control.remove();
      this.controls.delete(id);
    }
  }

  get gameIsReady() {
    return this.platoons.length > 1;
  }
}

type EventHandler = (e: Event) => void
class Control {
  action?: EventHandler;
  text?: string;

  uuid: string;

  element: HTMLElement;
  constructor() {
    this.uuid = crypto.randomUUID();

    this.element = document.createElement('button');
  }

  setAction(handler: EventHandler) {
    this.action && this.element.removeEventListener('click', this.action);
    this.action = handler;
    this.element.addEventListener('click', this.action);
  }

  changeText(text: string) {
    this.text = text;
    this.element.textContent = this.text;
  }

  remove() {
    this.element.remove();
  }
}
