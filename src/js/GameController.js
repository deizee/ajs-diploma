import themes from './themes';
import Team from './Team';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import { getArrayOfPositions, isStepPossible, isAttackPossible } from './utils';
import GamePlay from './GamePlay';
import cursors from './cursors';
import GameState from './GameState';
import Chatacter from './Character';

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
    this.players = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];
    this.isUserTurn = true;
    this.stepIsPossible = false;
    this.attackIsPossible = false;

    this.gamePlay.drawUi(themes[this.currentLevel - 1]);
    this.gamePlay.redrawPositions(this.players);

    const levelElement = document.getElementById('level');
    const scoresElement = document.getElementById('scores');
    const recordElement = document.getElementById('record');
    levelElement.textContent = this.currentLevel;
    scoresElement.textContent = this.scores;
    recordElement.textContent = this.record;

    this.onCellClickSubscriber();
    this.onCellEnterSubscriber();
    this.onCellLeaveSubscriber();
    this.onNewGameSubscriber();
    this.onSaveGameSubscriber();
    this.onLoadGameSubscriber();
  }

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
    const currentCharacter = this.players.find((el) => el.position === index);
    // если в ячейке есть персонаж и он игрок, то убирай предыдущие выделения, выделяй его и записывай его в this.selectChar
    if (currentCharacter && currentCharacter.character.isPlayer) {
      this.players.forEach((el) => this.gamePlay.deselectCell(el.position));
      this.gamePlay.selectCell(index);
      this.selectChar = currentCharacter;
    }
    // если нет выбранного персонажа и в ячейке есть персонаж и он не игрок, то показывай ошибку, что его выбирать нельзя
    if (!this.selectChar && currentCharacter && !currentCharacter.character.isPlayer) {
      GamePlay.showError('This is not a playable character');
      return;
    }
    // если есть выбранный персонаж, и мы кликаем на пустую ячейку, то проверяй, можно ли туда сходить. Если да, то ходи
    if (this.selectChar && !currentCharacter && this.selectChar.position !== index) {
      if (this.stepIsPossible) {
        this.makeStep(this.selectChar, index);
      }
    }
    // если есть выбранный персонаж, и мы кликаем на персонаж компьютера, то проверяй, можно ли атаковать. Если да, то атакуй
    if (this.selectChar && currentCharacter && this.selectChar.position !== index) {
      if (this.attackIsPossible) {
        this.attackTheEnemy(this.selectChar, currentCharacter);
      }
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    const currentCharacter = this.players.find((el) => el.position === index);

    // если есть выбранный персонаж, то убирай выделения у остальных персонажей
    if (this.selectChar) {
      this.gamePlay.cells.forEach((cell) => {
        if (this.gamePlay.cells.indexOf(cell) !== this.selectChar.position) {
          this.gamePlay.deselectCell(this.gamePlay.cells.indexOf(cell));
        }
      });
    }

    // если наводим на ячейку, в которой есть персонаж, то показывай его статы
    if (currentCharacter) {
      const { level, attack, defence, health } = currentCharacter.character;
      this.gamePlay.showCellTooltip(`🎖${level} ⚔${attack} 🛡${defence} ❤${health}`, index);
      this.gamePlay.setCursor(cursors.pointer);
    } else {
      this.gamePlay.setCursor(cursors.auto);
    }

    // если есть выбранный персонаж, и наводим на пустую ячейку, то подсвечиваем зеленым, если туда можно сходить
    if (!currentCharacter && this.selectChar) {
      this.stepIsPossible = isStepPossible(
        this.selectChar.position,
        index,
        this.selectChar.character.step,
        this.gamePlay.boardSize
      ).success;
      if (this.stepIsPossible) {
        this.gamePlay.selectCell(index, 'green');
        this.gamePlay.setCursor(cursors.pointer);
      }
    }

    // если есть выбранный, персонаж и наводим на персонаж компьютера, то проверяй, находится ли он в зоне атаки.
    // Если да, то подсвечивай его красным и меняй курсор на crosshair. Если нет, то меняй курсор на notallowed
    if (this.selectChar && currentCharacter && !currentCharacter.character.isPlayer) {
      this.attackIsPossible = isAttackPossible(
        this.selectChar.position,
        currentCharacter.position,
        this.selectChar.character.range,
        this.gamePlay.boardSize
      );
      if (this.attackIsPossible) {
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

  onSaveGameSubscriber() {
    this.gamePlay.addSaveGameListener(this.onSaveGame.bind(this));
  }

  onLoadGameSubscriber() {
    this.gamePlay.addLoadGameListener(this.onLoadGame.bind(this));
  }

  attackTheEnemy(attacker, defender) {
    const enemy = defender;
    const attackPoints = Math.max(
      attacker.character.attack - enemy.character.defence,
      attacker.character.attack * 0.1
    ).toFixed(0);
    this.players = [...this.players].filter((el) => el !== enemy);
    enemy.character.damage(attackPoints);
    if (enemy.character.health > 0) {
      this.players.push(enemy);
      this.gamePlay.showDamage(enemy.position, attackPoints).then(() => this.endOfTurn());
    } else {
      this.endOfTurn();
    }
  }

  computerTurn() {
    const arrayOfEnemies = [];
    const arrayOfUser = [];
    this.players.forEach((el) => {
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
        const positions = [...this.players].map((char) => char.position);
        return !positions.includes(index);
      });

      this.makeStep(
        enemyForStep,
        validCellsForStep[Math.floor(Math.random() * validCellsForStep.length)]
      );
    }
  }

  makeStep(char, index) {
    this.players = [...this.players].filter((el) => el !== char);
    char.position = index;
    this.players.push(char);
    this.endOfTurn();
  }

  endOfTurn() {
    this.gamePlay.cells.forEach((cell) =>
      this.gamePlay.deselectCell(this.gamePlay.cells.indexOf(cell))
    );
    if (this.selectChar && this.selectChar.character.health <= 0) {
      this.selectChar = null;
    }
    const arrayOfEnemies = [...this.players].filter((char) => !char.character.isPlayer);
    if (arrayOfEnemies.length === 0) {
      this.nextLevel();
      return;
    }
    const arrayOfUser = [...this.players].filter((char) => char.character.isPlayer);
    if (arrayOfUser.length === 0) {
      this.endOfGame();
      GamePlay.showMessage('You lose...');
      return;
    }
    this.gamePlay.setCursor(cursors.auto);
    this.gamePlay.redrawPositions(this.players);
    if (this.selectChar) {
      this.gamePlay.selectCell(this.selectChar.position);
    }
    if (this.isUserTurn) {
      this.isUserTurn = false;
      this.computerTurn();
    } else {
      this.isUserTurn = true;
    }
  }

  nextLevel() {
    this.currentLevel += 1;
    if (this.currentLevel < 5) {
      GamePlay.showMessage('START NEW LEVEL!');
    } else {
      this.endOfGame();
      GamePlay.showMessage('YOU WIN THE GAME!');
      return;
    }
    this.gamePlay.drawUi(themes[this.currentLevel - 1]);
    this.scores += this.players.reduce((acc, prev) => acc + prev.character.health, 0);
    const levelElement = document.getElementById('level');
    const scoresElement = document.getElementById('scores');
    const recordElement = document.getElementById('record');
    levelElement.textContent = this.currentLevel;
    scoresElement.textContent = this.scores;
    this.record = Math.max(this.record, this.scores);
    recordElement.textContent = this.record;
    // апаем оставшихся персонажей
    this.players.reduce((acc, prev) => {
      prev.character.levelUp();
      acc.push(prev);
      return acc;
    }, []);
    // создаем новых игроков и добавляем их в команду
    const quantityOfNewChars = this.currentLevel > 2 ? 2 : 1;
    const newChars = generateTeam(new Team().userTeam, this.currentLevel - 1, quantityOfNewChars);
    // генерируем массивы команд с новыми позициями
    let newUserTeam = [...this.players].map((char) => char.character);
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
    // обновляем массив игроков и перерисовываем поле
    this.players = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];
    this.gamePlay.cells.forEach((cell) =>
      this.gamePlay.deselectCell(this.gamePlay.cells.indexOf(cell))
    );
    this.selectChar = null;
    this.gamePlay.redrawPositions(this.players);
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
    this.scores += this.players.reduce((acc, prev) => acc + prev.character.health, 0);
    const scoresElement = document.getElementById('scores');
    scoresElement.textContent = this.scores;
    this.record = Math.max(this.record, this.scores);
    const recordElement = document.getElementById('record');
    recordElement.textContent = this.record;
    this.gamePlay.redrawPositions(this.players);
  }

  onNewGame() {
    this.unsubscriber();
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
    this.players = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];
    this.userTurn = true;

    this.gamePlay.drawUi(themes[this.currentLevel - 1]);
    this.gamePlay.redrawPositions(this.players);

    const levelElement = document.getElementById('level');
    const scoresElement = document.getElementById('scores');
    const recordElement = document.getElementById('record');
    levelElement.textContent = this.currentLevel;
    scoresElement.textContent = this.scores;
    this.record = Math.max(this.record, this.scores);
    recordElement.textContent = this.record;
    this.onCellClickSubscriber();
    this.onCellEnterSubscriber();
    this.onCellLeaveSubscriber();
  }

  onSaveGame() {
    const stateObj = {
      players: this.players,
      level: this.currentLevel,
      scores: this.scores,
      record: this.record,
      isUserTurn: this.isUserTurn,
    };
    this.stateService.save(GameState.from(stateObj));
  }

  onLoadGame() {
    const state = GameState.from(this.stateService.load());

    this.currentLevel = state.level;
    this.scores = state.scores;
    this.record = state.record;
    this.players = state.players;
    this.isUserTurn = state.isUserTurn;

    this.players = this.players.reduce((acc, prev) => {
      prev.character.__proto__ = Chatacter.prototype;
      acc.push(prev);
      return acc;
    }, []);

    this.gamePlay.drawUi(themes[this.currentLevel - 1]);
    this.gamePlay.redrawPositions(this.players);

    const levelElement = document.getElementById('level');
    const scoresElement = document.getElementById('scores');
    const recordElement = document.getElementById('record');
    levelElement.textContent = this.currentLevel;
    scoresElement.textContent = this.scores;
    recordElement.textContent = this.record;
  }

  unsubscriber() {
    this.gamePlay.unsubscribe();
  }
}
