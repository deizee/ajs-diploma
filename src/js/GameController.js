import themes from './themes';
import Team from './Team';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import { getArrayOfPositions, isStepPossible, isAttackPossible } from './utils';
import GamePlay from './GamePlay';
import cursors from './cursors';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.userTeam = generateTeam(new Team().userTeam, 1, 2);
    this.computerTeam = generateTeam(new Team().computerTeam, 1, 2);
    this.userTeamWithPositions = this.generateTeamWithPositions(
      this.userTeam,
      getArrayOfPositions('user', this.gamePlay.boardSize)
    );
    this.computerTeamWithPositions = this.generateTeamWithPositions(
      this.computerTeam,
      getArrayOfPositions('computer', this.gamePlay.boardSize)
    );
    this.allTeamsWithPositions = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];

    this.gamePlay.drawUi(themes.prairie);
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
      this.selectChar = currentCharacter;
    } else {
      GamePlay.showError('This is not a playable character');
    }

    if (!currentCharacter && this.selectChar) {
      if (
        isStepPossible(
          this.selectChar.position,
          index,
          this.selectChar.character.step,
          this.gamePlay.boardSize
        )
      ) {
        this.selectChar.position = index;
        this.allTeamsWithPositions[
          this.allTeamsWithPositions.indexOf(this.selectChar)
        ].position = index;
        this.gamePlay.redrawPositions(this.allTeamsWithPositions);
      }
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    const currentCharacter = this.allTeamsWithPositions.find((el) => el.position === index);

    if (this.selectChar) {
      this.gamePlay.cells.forEach((cell) => {
        if (this.gamePlay.cells.indexOf(cell) !== this.selectChar.position) {
          this.gamePlay.deselectCell(this.gamePlay.cells.indexOf(cell));
        }
      });
    }

    if (currentCharacter) {
      const { level, attack, defence, health } = currentCharacter.character;
      this.gamePlay.showCellTooltip(`🎖${level} ⚔${attack} 🛡${defence} ❤${health}`, index);
      this.gamePlay.setCursor(cursors.pointer);
    } else {
      this.gamePlay.setCursor(cursors.auto);
    }

    if (!currentCharacter && this.selectChar) {
      if (
        isStepPossible(
          this.selectChar.position,
          index,
          this.selectChar.character.step,
          this.gamePlay.boardSize
        )
      ) {
        this.gamePlay.selectCell(index, 'green');
        this.gamePlay.setCursor(cursors.pointer);
      }
    }

    if (
      this.selectChar &&
      currentCharacter &&
      (currentCharacter.character.type === 'daemon' ||
        currentCharacter.character.type === 'undead' ||
        currentCharacter.character.type === 'vampire')
    ) {
      if (
        isAttackPossible(
          this.selectChar.position,
          currentCharacter.position,
          this.selectChar.character.range,
          this.gamePlay.boardSize
        )
      ) {
        this.gamePlay.selectCell(index, 'red');
        this.gamePlay.setCursor(cursors.crosshair);
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
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
