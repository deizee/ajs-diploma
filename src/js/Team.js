import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Daemon from './characters/Daemon';
// import Magician from './characters/Magician';
import Undead from './characters/Undead';
import Vampire from './characters/Vampire';

const userTeam = [Bowman, Swordsman];
const computerTeam = [Daemon, Undead, Vampire];

export default class Team {
  constructor() {
    this.userTeam = userTeam;
    this.computerTeam = computerTeam;
  }
}
