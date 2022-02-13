import { Board } from "./Board.ts";
import { Game } from "./Game.ts";
import { Unit } from "./Units/Unit.ts";

export class Platoon {
  units: Map<string, Unit>;
  board: Board;
  game: Game;
  constructor(board: Board, game: Game, color = 'green') {
    this.units = new Map();
    this.board = board
    this.game = game;
    for (let i = 0; i < 10; i++) {
      const unit = new Unit(this.board, color, this, this.game);
      unit.xPos = Math.floor(Math.random() * board.gridSize.x)
      unit.yPos = Math.floor(Math.random() * board.gridSize.y)

      this.units.set(unit.uuid, unit);
    }
  }
}
