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
    this.currentLevel = 1;
    this.scores = 0;
    this.record = 0;
    const userTeam = generateTeam(new Team().userTeam, 1, 2);
    const computerTeam = generateTeam(new Team().computerTeam, 1, 2);
    this.userTeamWithPositions = this.generateTeamWithPositions(
      userTeam,
      getArrayOfPositions('user', this.gamePlay.boardSize)
    );
    this.computerTeamWithPositions = this.generateTeamWithPositions(
      computerTeam,
      getArrayOfPositions('computer', this.gamePlay.boardSize)
    );
    this.state = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];
    this.userTurn = true;

    this.gamePlay.drawUi(themes[this.currentLevel - 1]);
    this.gamePlay.redrawPositions(this.state);

    const levelElement = document.getElementById('level');
    const scoresElement = document.getElementById('scores');
    levelElement.textContent = this.currentLevel;
    scoresElement.textContent = this.scores;

    this.onCellClickSubscriber();
    this.onCellEnterSubscriber();
    this.onCellLeaveSubscriber();
    this.onNewGameSubscriber();
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

    if (currentCharacter && currentCharacter.character.isPlayer) {
      this.state.forEach((el) => this.gamePlay.deselectCell(el.position));
      this.gamePlay.selectCell(index);
      this.selectChar = currentCharacter;
    }
    if (!this.selectChar && currentCharacter && !currentCharacter.character.isPlayer) {
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

    if (this.selectChar && currentCharacter && !currentCharacter.character.isPlayer) {
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

  onNewGameSubscriber() {
    this.gamePlay.addNewGameListener(this.onNewGame.bind(this));
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
    const arrayOfEnemies = [];
    const arrayOfUser = [];
    this.state.forEach((el) => {
      if (!el.character.isPlayer) {
        arrayOfEnemies.push(el);
      } else {
        arrayOfUser.push(el);
      }
    });

    if (arrayOfEnemies.length === 0) {
      return;
    }

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
    const arrayOfEnemies = [...this.state].filter((char) => !char.character.isPlayer);
    if (arrayOfEnemies.length === 0) {
      this.nextLevel();
      return;
    }
    this.gamePlay.setCursor(cursors.auto);
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

  nextLevel() {
    console.log('YOU WIN!');
    this.currentLevel += 1;
    if (this.currentLevel > 4) {
      this.endOfGame();
      return;
    }
    this.gamePlay.drawUi(themes[this.currentLevel - 1]);
    this.scores += this.state.reduce((acc, prev) => acc + prev.character.health, 0);
    const levelElement = document.getElementById('level');
    const scoresElement = document.getElementById('scores');
    const recordElement = document.getElementById('record');
    levelElement.textContent = this.currentLevel;
    scoresElement.textContent = this.scores;
    recordElement.textContent = this.record;
    // апаем оставшихся персонажей
    this.state.reduce((acc, prev) => {
      prev.character.levelUp();
      acc.push(prev);
      return acc;
    }, []);
    // создаем новых игроков и добавляем их в команду
    const cuantityOfNewChars = this.currentLevel > 2 ? 2 : 1;
    const newChars = generateTeam(new Team().userTeam, this.currentLevel - 1, cuantityOfNewChars);
    // генерируем массивы команд с новыми позициями
    let newUserTeam = [...this.state].map((char) => char.character);
    newUserTeam = [...newUserTeam, ...newChars];
    this.userTeamWithPositions = this.generateTeamWithPositions(
      newUserTeam,
      getArrayOfPositions('user', this.gamePlay.boardSize)
    );
    const newComputerTeam = generateTeam(
      new Team().computerTeam,
      this.currentLevel,
      newUserTeam.length
    );
    this.computerTeamWithPositions = this.generateTeamWithPositions(
      this.statesUpForCompChars(newComputerTeam),
      getArrayOfPositions('computer', this.gamePlay.boardSize)
    );
    // обновляем state и перерисовываем поле
    this.state = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];
    this.gamePlay.cells.forEach((cell) =>
      this.gamePlay.deselectCell(this.gamePlay.cells.indexOf(cell))
    );
    this.selectChar = null;
    this.gamePlay.redrawPositions(this.state);
  }

  statesUpForCompChars(team) {
    return team.reduce((acc, char) => {
      for (let i = 1; i < char.level; i++) {
        char.statesUp();
      }
      acc.push(char);
      return acc;
    }, []);
  }

  endOfGame() {
    this.unsubscriber();
    alert('YOU WIN THE GAME!');
    this.record = Math.max(this.record, this.scores);
    const recordElement = document.getElementById('record');
    recordElement.textContent = this.record;
    this.gamePlay.redrawPositions(this.state);
  }

  onNewGame() {
    this.currentLevel = 1;
    this.scores = 0;
    const userTeam = generateTeam(new Team().userTeam, 1, 2);
    const computerTeam = generateTeam(new Team().computerTeam, 1, 2);
    this.userTeamWithPositions = this.generateTeamWithPositions(
      userTeam,
      getArrayOfPositions('user', this.gamePlay.boardSize)
    );
    this.computerTeamWithPositions = this.generateTeamWithPositions(
      computerTeam,
      getArrayOfPositions('computer', this.gamePlay.boardSize)
    );
    this.state = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];
    this.userTurn = true;

    this.gamePlay.drawUi(themes[this.currentLevel - 1]);
    this.gamePlay.redrawPositions(this.state);

    const levelElement = document.getElementById('level');
    const scoresElement = document.getElementById('scores');
    const recordElement = document.getElementById('record');
    levelElement.textContent = this.currentLevel;
    scoresElement.textContent = this.scores;
    recordElement.textContent = this.record;

    this.onCellClickSubscriber();
    this.onCellEnterSubscriber();
    this.onCellLeaveSubscriber();
  }

  unsubscriber() {
    this.gamePlay.unsubscribe();
  }
}
