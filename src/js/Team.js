import Bowman from './Bowman';
import Swordsman from './Swordsman';
import Daemon from './Daemon';
import Magician from './Magician';
import Undead from './Undead';
import Vampire from './Vampire';

const userTeam = [Bowman, Swordsman, Magician];
const computerTeam = [Daemon, Undead, Vampire];

export default class Team {
  constructor() {
    this.userTeam = userTeam;
    this.computerTeam = computerTeam;
  }
}
