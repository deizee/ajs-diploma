import themes from './themes';
import Team from './Team';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import { getArrayOfPositions } from './utils';
import GamePlay from './GamePlay';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.userTeam = generateTeam(new Team().userTeam, 1, 2);
    this.computerTeam = generateTeam(new Team().computerTeam, 1, 2);
    this.userTeamWithPositions = [];
    this.computerTeamWithPositions = [];
    this.allTeamsWithPositions = [];
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.drawUi(themes.prairie);

    const userPositions = getArrayOfPositions('user', this.gamePlay.boardSize); // [0, 1, 8, 9, 16, 17, 24, 25, 32, 33, 40, 41, 48, 49, 56, 57];
    const compPositions = getArrayOfPositions('computer', this.gamePlay.boardSize); // [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];

    this.userTeamWithPositions = this.generateTeamWithPositions(this.userTeam, userPositions);
    this.computerTeamWithPositions = this.generateTeamWithPositions(
      this.computerTeam,
      compPositions
    );

    this.allTeamsWithPositions = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];

    this.gamePlay.redrawPositions(this.allTeamsWithPositions);

    this.onCellClickSubscriber();
    this.onCellEnterSubscriber();
    this.onCellLeaveSubscriber();
  }

  // eslint-disable-next-line class-methods-use-this
  generateTeamWithPositions(team, arrayOfPositions) {
    const array = arrayOfPositions;
    return team.reduce((acc, prev) => {
      const position = array[Math.floor(Math.random() * (arrayOfPositions.length - 1))];
      acc.push(new PositionedCharacter(prev, position));
      array.splice(array.indexOf(position), 1);
      return acc;
    }, []);
  }

  onCellClick(index) {
    // TODO: react to click
    const currentCharacter = this.allTeamsWithPositions.find((el) => el.position === index);
    if (!currentCharacter) return;

    if (
      currentCharacter.character.type === 'bowman' ||
      currentCharacter.character.type === 'swordsman' ||
      currentCharacter.character.type === 'magician'
    ) {
      this.allTeamsWithPositions.forEach((el) => this.gamePlay.deselectCell(el.position));
      this.gamePlay.selectCell(index);
    } else {
      GamePlay.showError('This is not a playable character');
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    const currentCharacter = this.allTeamsWithPositions.find((el) => el.position === index);
    if (!currentCharacter) return;

    const { level, attack, defence, health } = currentCharacter.character;
    this.gamePlay.showCellTooltip(`🎖${level} ⚔${attack} 🛡${defence} ❤${health}`, index);
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
  }

  onCellClickSubscriber() {
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
  }

  onCellEnterSubscriber() {
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
  }

  onCellLeaveSubscriber() {
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
  }
}
