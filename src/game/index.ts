export class Game {
  platoons: [];
  turnNumber: number;

  constructor(g?: Game) {
    this.platoons = g?.platoons || [];
    this.turnNumber = g?.turnNumber || 0;
  }

  get currentPlatoon() {
    return this.platoons[this.turnNumber % this.platoons.length];
  }

  get gameIsReady() {
    return this.platoons.length > 1;
  }
}