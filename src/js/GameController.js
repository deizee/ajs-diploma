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
    this.state = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];
    this.userTurn = true;

    this.gamePlay.drawUi(themes.prairie);
    this.gamePlay.redrawPositions(this.state);

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
    const currentCharacter = this.state.find((el) => el.position === index);

    if (
      currentCharacter &&
      (currentCharacter.character.type === 'bowman' ||
        currentCharacter.character.type === 'swordsman' ||
        currentCharacter.character.type === 'magician')
    ) {
      this.state.forEach((el) => this.gamePlay.deselectCell(el.position));
      this.gamePlay.selectCell(index);
      this.selectChar = currentCharacter;
    }
    if (
      !this.selectChar &&
      currentCharacter &&
      (currentCharacter.character.type === 'daemon' ||
        currentCharacter.character.type === 'undead' ||
        currentCharacter.character.type === 'vampire')
    ) {
      GamePlay.showError('This is not a playable character');
      return;
    }
    if (this.selectChar && !currentCharacter && this.selectChar.position !== index) {
      if (
        isStepPossible(
          this.selectChar.position,
          index,
          this.selectChar.character.step,
          this.gamePlay.boardSize
        ).success
      ) {
        this.makeStep(this.selectChar, index);
      }
    }
    if (this.selectChar && currentCharacter && this.selectChar.position !== index) {
      if (
        isAttackPossible(
          this.selectChar.position,
          currentCharacter.position,
          this.selectChar.character.range,
          this.gamePlay.boardSize
        )
      ) {
        this.attackTheEnemy(this.selectChar, currentCharacter);
      }
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    const currentCharacter = this.state.find((el) => el.position === index);

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
        ).success
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

  attackTheEnemy(attacker, defender) {
    const enemy = defender;
    const attackPoints = Math.max(
      attacker.character.attack - enemy.character.defence,
      attacker.character.attack * 0.1
    );
    this.state = [...this.state].filter((el) => el !== enemy);
    enemy.character.damage(attackPoints);
    if (enemy.character.health > 0) {
      this.state.push(enemy);
    }
    this.gamePlay.showDamage(enemy.position, attackPoints).then(() => this.endOfTurn());
  }

  computerTurn() {
    // debugger;
    const arrayOfEnemies = [];
    const arrayOfUser = [];
    this.state.forEach((el) => {
      if (
        el.character.type === 'daemon' ||
        el.character.type === 'undead' ||
        el.character.type === 'vampire'
      ) {
        arrayOfEnemies.push(el);
      } else {
        arrayOfUser.push(el);
      }
    });

    const canAttackEnemies = arrayOfEnemies.reduce((acc, prev) => {
      const arrayOfDefenders = [];
      arrayOfUser.forEach((userChar, index) => {
        const canAttack = isAttackPossible(
          prev.position,
          userChar.position,
          prev.character.range,
          this.gamePlay.boardSize
        );
        if (canAttack) {
          arrayOfDefenders.push(arrayOfUser[index]);
        }
      });
      if (arrayOfDefenders.length > 0) {
        acc.push({
          attacker: prev,
          defenders: arrayOfDefenders,
        });
      }
      return acc;
    }, []);

    const attackerObj = canAttackEnemies[Math.floor(Math.random() * canAttackEnemies.length)];
    if (attackerObj) {
      const defender =
        attackerObj.defenders[Math.floor(Math.random() * attackerObj.defenders.length)];
      this.attackTheEnemy(attackerObj.attacker, defender);
    } else {
      const enemyForStep = arrayOfEnemies[Math.floor(Math.random() * arrayOfEnemies.length)];
      const valCells = isStepPossible(
        enemyForStep.position,
        0,
        enemyForStep.character.step,
        this.gamePlay.boardSize
      ).validCells;

      const validCellsForStep = valCells.filter((index) => {
        const positions = [...this.state].map((char) => char.position);
        return !positions.includes(index);
      });

      this.makeStep(
        enemyForStep,
        validCellsForStep[Math.floor(Math.random() * validCellsForStep.length)]
      );
    }
  }

  makeStep(char, index) {
    this.state = [...this.state].filter((el) => el !== char);
    char.position = index;
    this.state.push(char);
    this.endOfTurn();
  }

  endOfTurn() {
    this.gamePlay.cells.forEach((cell) =>
      this.gamePlay.deselectCell(this.gamePlay.cells.indexOf(cell))
    );
    if (this.selectChar && this.selectChar.character.health <= 0) {
      this.selectChar = null;
    }
    this.gamePlay.redrawPositions(this.state);
    if (this.selectChar) {
      this.gamePlay.selectCell(this.selectChar.position);
    }
    if (this.userTurn) {
      this.userTurn = false;
      this.computerTurn();
    } else {
      this.userTurn = true;
    }
  }
}
