import { Unit } from "./Unit.ts";

export class Equipment {
  points: number;

  armor?: number;
  health?: number;

  // accuracy is a multiplier that affects the chance of a weapon hitting
  accuracy?: number;
  // armorPiercing reduces the armor total of the target
  armorPiercing?: number;

  damage?: number;

  classification: 'melee' | 'ranged' | 'armor' | 'other';

  bearer: Unit;
  actions?: Function[];

  constructor(bearer: Unit) {
    this.points = 1;
    this.classification = 'other';
    this.bearer = bearer;
  }

  registerActions() {
    if (this.actions?.length)
      this.bearer.registerActions(this.actions);
  }

}