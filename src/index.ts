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

const sym1 = new Structure(twoStory)
sym1.xPos = board.gridSize.x - twoStory.width - twoStory.xPos;
sym1.yPos = board.gridSize.y - twoStory.height - twoStory.yPos;
const sym1SecondFloor = new Structure(secondFloor)
sym1SecondFloor.xPos = board.gridSize.x - secondFloor.width - secondFloor.xPos;
sym1SecondFloor.yPos = board.gridSize.y - secondFloor.height - secondFloor.yPos;

twoStory.substructures.push(secondFloor);
sym1.substructures.push(sym1SecondFloor);
board.registerStructure(twoStory);
board.registerStructure(sym1);

const small = new Structure({
  xPos: 30,
  yPos: 7,
  width: 7,
  height: 12
})
const sym2 = new Structure(small)
sym2.xPos = board.gridSize.x - small.width - small.xPos;
sym2.yPos = board.gridSize.y - small.height - small.yPos;
board.registerStructure(small);
board.registerStructure(sym2);

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

canvas.addEventListener('wheel', (e) => {
  
})