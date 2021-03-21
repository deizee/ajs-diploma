import Character from './Character';

export default class Undead extends Character {
  constructor(level) {
    super(level, 'undead');

    this.attack = 40;
    this.defence = 10;
    this.step = 4;
    this.range = 1;
    this.isPlayer = false;
  }
}
