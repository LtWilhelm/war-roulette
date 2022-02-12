import { Board } from "./Board.ts";

export class Game {
  platoons: [];
  turnNumber: number;

  board?: Board;
  boardId: string;

  timer: number;

  constructor(g?: Game) {
    this.platoons = g?.platoons || [];
    this.turnNumber = g?.turnNumber || 0;

    this.boardId = g?.boardId || 'default';

    this.timer = setInterval(() => {
      if (this.board)
        this.board.draw();
    }, (100/6));
  }

  setBoard(board: Board) {
    this.board = board;
    board.game = this;
  }

  stopGame() {
    clearInterval(this.timer);
  }

  get currentPlatoon() {
    return this.platoons[this.turnNumber % this.platoons.length];
  }

  get gameIsReady() {
    return this.platoons.length > 1;
  }
}