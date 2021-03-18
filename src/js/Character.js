export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 100;
    this.type = type;
    // TODO: throw error if user use "new Character()"
    if (new.target === Character) {
      throw new Error('Ошибка создания класса');
    }
  }

  levelUp() {
    if (this.health === 0) {
      throw new Error('Нельзя повысить левел умершего');
    }

    this.level += 1;
    this.attack = Math.max(
      this.attack,
      +(this.attack * (1.8 - (1 - this.health / 100))).toFixed(0)
    );
    this.defence = Math.max(
      this.defence,
      +(this.defence * (1.8 - (1 - this.health / 100))).toFixed(0)
    );
    this.health += 80;
    if (this.health > 100) {
      this.health = 100;
    }
  }

  statesUp() {
    this.attack = Math.max(
      this.attack,
      +(this.attack * (1.8 - (1 - this.health / 100))).toFixed(0)
    );
    this.defence = Math.max(
      this.defence,
      +(this.defence * (1.8 - (1 - this.health / 100))).toFixed(0)
    );
  }

  damage(points) {
    if (this.health > 0) {
      this.health -= points;
      if (this.health < 0) {
        this.health = 0;
      }
    }
  }
}
