import { Board } from "./game/Board.ts";
import { Structure } from "./game/Structure.ts";
import { Unit } from "./game/Unit.ts";

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

setInterval(() => board.draw(), 100 / 6);

const gridToggle: HTMLInputElement | null = document.querySelector('#show-grid');
gridToggle!.checked = board.showGrid;
gridToggle!.addEventListener('change', function (e) {
  e.preventDefault();

  board.showGrid = !board.showGrid;

  gridToggle!.checked = board.showGrid;
})

const testUnit = new Unit(board);
testUnit.xPos = 15;
testUnit.yPos = 14;
const testUnit2 = new Unit(board);
testUnit2.xPos = 20;
testUnit2.yPos = 35;

board.registerEntitity(testUnit, 'units');
board.registerEntitity(testUnit2, 'units');

declare global {
  interface Window {
    board: any;
  }
}

window.board = board;