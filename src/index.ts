import { Board } from "./game/Board.ts";
import { Game } from "./game/Game.ts";
import { Platoon } from "./game/Platoon.ts";
import { Structure } from "./game/Structure.ts";

const canvas = document.querySelector("#game-board") as HTMLCanvasElement;

const board = new Board(canvas);

board.registerStructure(new Structure({
  xPos: 5,
  yPos: 15,
  width: 15,
  height: 10
}), true);

board.registerStructure(new Structure({
  xPos: 30,
  yPos: 7,
  width: 7,
  height: 12
}), true);

const game = new Game(board);
game.registerPlatoon(new Platoon(board, game, 'red'));
game.registerPlatoon(new Platoon(board, game, 'green'));

const gridToggle: HTMLInputElement | null = document.querySelector('#show-grid');
gridToggle!.checked = board.showGrid;
gridToggle!.addEventListener('change', function (e) {
  e.preventDefault();

  board.showGrid = !board.showGrid;

  gridToggle!.checked = board.showGrid;
})

declare global {
  interface Window {
    board: any;
  }
  interface Crypto {
    randomUUID(): string;
  }
}

window.board = board;