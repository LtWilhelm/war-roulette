import { Board } from "./game/Board.ts";
import { Game } from "./game/Game.ts";
import { Platoon } from "./game/Platoon.ts";
import { Structure } from "./game/Structure.ts";

const canvas = document.querySelector("#game-board") as HTMLCanvasElement;

const board = new Board(canvas);

const twoStory = new Structure({
  xPos: 5,
  yPos: 15,
  width: 15,
  height: 10
});
const secondFloor = new Structure({
  xPos: 5,
  yPos: 15,
  width: 5,
  height: 5,
});
secondFloor.fillStyle = '#722872';
secondFloor.altitude = 2;

twoStory.substructures.push(secondFloor);
board.registerStructure(twoStory, true);

board.registerStructure(new Structure({
  xPos: 30,
  yPos: 7,
  width: 7,
  height: 12
}), true);

const game = new Game(board);
game.registerPlatoon(new Platoon(board, game, 'green'));
game.registerPlatoon(new Platoon(board, game, 'red'));

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