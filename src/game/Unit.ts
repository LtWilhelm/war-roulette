export class Unit {
  xPos: number;
  yPos: number;

  health: number;
  speed: number;

  // shootingSkill is a multiplier that determines how likely a shot is to hit, between 0 and 1
  shootingSkill: number;
  // fightingSkill is a multiplier that compares with opponent fighting skill, between 0 and 1
  fightingSkill: number;

  // armor is a divisor that applies to all incoming attacks
  armor: number;
  // agility is a divisor that applies to melee attacks. Some units may be "hyper agile" meaning their agility is applied in shooting attacks as well
  agility: number;
  isHyperAgile: boolean;

  actionPoints: number;

  equipment: [];

  actions?: Function[];

  constructor() {
    this.xPos = 0;
    this.yPos = 0;
    
    this.health = 10;
    this.speed = 10;

    this.shootingSkill = .5;
    this.fightingSkill = .5;
    this.armor = 1;
    this.agility = 1;
    this.isHyperAgile = false;

    this.actionPoints = 3;
    this.equipment = [];
  }

  shootAt(u: Unit, weapon: number) {
    
  }

  registerActions(actions: Function[]) {
    if (!this.actions) this.actions = [];

    this.actions = this.actions.concat(actions);
  }
}