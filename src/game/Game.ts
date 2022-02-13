import { Board } from "./Board.ts";
import { Platoon } from "./Platoon.ts";
import { Unit } from "./Units/Unit.ts";

export class Game {
  platoons: Platoon[];
  turnNumber: number;

  board: Board;

  timer: number;

  activeUnit?: Unit;
  selectedUnit?: Unit;
  get activePlatoon() {
    return this.platoons[this.turnNumber % this.platoons.length]
  }

  constructor(board: Board) {
    this.board = board;
    this.board.game = this;

    this.platoons = [];
    this.turnNumber = 0;

    this.timer = setInterval(() => {
      if (this.board)
        this.board.draw();
    }, (100 / 6));
  }

  stopGame() {
    clearInterval(this.timer);
  }

  selectUnit(unit: Unit) {
    this.selectedUnit?.onDeselect();
    this.selectedUnit = unit;
    unit.onSelect();
  }
  deselctUnit() {
    this.selectedUnit?.onDeselect();
    this.selectedUnit = undefined;
  }

  registerPlatoon(p: Platoon) {
    this.platoons.push(p);
    console.log('registering');
    for (const unit of p.units.values()) {
      this.board.registerEntitity(unit, 'units');
    }
  }

  get gameIsReady() {
    return this.platoons.length > 1;
  }
}