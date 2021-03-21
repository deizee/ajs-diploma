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
    this.record = 0; // максимальное количество очков (рекорд)

    this.prepareTheGame(); // подготовка к игре
    this.onCellClickSubscriber();
    this.onCellEnterSubscriber();
    this.onCellLeaveSubscriber();
    this.onNewGameSubscriber();
    this.onSaveGameSubscriber();
    this.onLoadGameSubscriber();
    this.renderScores(); // отрисовка уровня, очков и рекорда
  }

  prepareTheGame() {
    this.currentLevel = 1; // текущий уровень
    this.gamePlay.drawUi(themes[this.currentLevel - 1]); // отрисовываем тему
    this.scores = 0; // очки
    this.selectChar = null; // выделенный персонаж
    const userTeam = generateTeam(new Team().userTeam, 1, 2); // команда игрока (без позиций)
    const computerTeam = generateTeam(new Team().computerTeam, 1, 2); // команда компьютера (без позиций)
    // генерируем команду игрока с позициями
    this.userTeamWithPositions = this.generateTeamWithPositions(
      userTeam,
      getArrayOfPositions('user', this.gamePlay.boardSize)
    );
    // генерируем команду компьютера с позициями
    this.computerTeamWithPositions = this.generateTeamWithPositions(
      computerTeam,
      getArrayOfPositions('computer', this.gamePlay.boardSize)
    );
    // объединяем их в один масив
    this.players = [...this.userTeamWithPositions, ...this.computerTeamWithPositions];
    this.isUserTurn = true; // булева переменная для определения очередности хода
    this.stepIsPossible = false; // переменная для определения возможности передвижения
    this.attackIsPossible = false; // переменная для определения возможности атаки

    this.gamePlay.redrawPositions(this.players); // отрисовываем персонажей
  }

  // функция, которая на вход принимает массив игроков и масив позиций и возвращает массив бъектов с игроками и их позициями
  generateTeamWithPositions(team, arrayOfPositions) {
    const array = arrayOfPositions;
    return team.reduce((acc, prev) => {
      const position = array[Math.floor(Math.random() * (arrayOfPositions.length - 1))];
      acc.push(new PositionedCharacter(prev, position));
      array.splice(array.indexOf(position), 1);
      return acc;
    }, []);
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    // записывает персонажа в переменную, если он есть в ячейке, на которую навели
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
    // если есть выбранный персонаж И наводим на пустую ячейку, то подсвечиваем зеленым, если туда можно сходить
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
    // если есть выбранный персонаж И наводим на персонаж компьютера, то проверяй, находится ли он в зоне атаки.
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

  onCellClick(index) {
    // записывает персонажа в переменную, если он есть в ячейке, на которую кликнули
    const currentCharacter = this.players.find((el) => el.position === index);
    // если в ячейке есть персонаж И он игрок, то убирай предыдущие выделения, выделяй его и записывай его в this.selectChar
    if (currentCharacter && currentCharacter.character.isPlayer) {
      this.players.forEach((el) => this.gamePlay.deselectCell(el.position));
      this.gamePlay.selectCell(index);
      this.selectChar = currentCharacter;
    }
    // если нет выбранного персонажа И в ячейке есть персонаж И он не игрок, то показывай ошибку, что его выбирать нельзя
    if (!this.selectChar && currentCharacter && !currentCharacter.character.isPlayer) {
      GamePlay.showError('This is not a playable character');
      return;
    }
    // если есть выбранный персонаж И мы кликаем на пустую ячейку, то проверяй, можно ли туда сходить. Если да, то ходи
    if (this.selectChar && !currentCharacter && this.selectChar.position !== index) {
      if (this.stepIsPossible) {
        this.makeStep(this.selectChar, index);
      }
    }
    // если есть выбранный персонаж И мы кликаем на персонаж компьютера, то проверяй, можно ли атаковать. Если да, то атакуй
    if (this.selectChar && currentCharacter && this.selectChar.position !== index) {
      if (this.attackIsPossible) {
        this.attackTheEnemy(this.selectChar, currentCharacter);
      }
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
  }

  // функция подсчета и анимации атаки. Принимает на вход атакующего и защищающегося персонажей
  attackTheEnemy(attacker, defender) {
    const enemy = defender;
    const attackPoints = Math.max(
      attacker.character.attack - enemy.character.defence,
      attacker.character.attack * 0.1
    ).toFixed(0);
    // удаляем персонажа, которого атакуем, из массива игроков, пересчитываем ему health с учетом дамага и,
    // если health > 0, то снова пушим его в массив, затем делаем переход хода.
    // если health <= 0, значит персонаж убит, не пушим его в массив, а просто делаем переход хода
    this.players = [...this.players].filter((el) => el !== enemy);
    enemy.character.damage(attackPoints);
    if (enemy.character.health > 0) {
      this.players.push(enemy);
      this.gamePlay.showDamage(enemy.position, attackPoints).then(() => this.endOfTurn()); // анимация дамага
    } else {
      this.endOfTurn();
    }
  }

  // конец хода
  endOfTurn() {
    // очищаем все ячейки от выделений =))
    this.gamePlay.cells.forEach((cell) =>
      this.gamePlay.deselectCell(this.gamePlay.cells.indexOf(cell))
    );
    // если есть выбранный персонаж И его здоровье < 0, то обнуляем его
    if (this.selectChar && this.selectChar.character.health <= 0) {
      this.selectChar = null;
    }

    // формируем массив персонажей компьютера. Если он пустой, тогда переходим на следующий уровень
    const arrayOfEnemies = [...this.players].filter((char) => !char.character.isPlayer);
    if (arrayOfEnemies.length === 0) {
      this.nextLevel();
      return;
    }
    // формируем массив персонажей игрока. Если он пустой, тогда завершаем игру и показываем сообщение о проигрыше
    const arrayOfUser = [...this.players].filter((char) => char.character.isPlayer);
    if (arrayOfUser.length === 0) {
      this.endOfGame();
      GamePlay.showMessage('You lose...');
      return;
    }
    // обнуляем курсор и перерисовываем персонажей
    this.gamePlay.setCursor(cursors.auto);
    this.gamePlay.redrawPositions(this.players);
    // если есть выбранный игрок, рисуем у него желтую подсветку
    if (this.selectChar) {
      this.gamePlay.selectCell(this.selectChar.position);
    }
    // меняем переменную очередности хода и вызываем ход компьютера
    if (this.isUserTurn) {
      this.isUserTurn = false;
      this.computerTurn();
    } else {
      this.isUserTurn = true;
    }
  }

  // ход компьютера
  computerTurn() {
    // разделяем персонажей на 2 команды
    const arrayOfEnemies = [];
    const arrayOfUser = [];
    this.players.forEach((el) => {
      if (!el.character.isPlayer) {
        arrayOfEnemies.push(el);
      } else {
        arrayOfUser.push(el);
      }
    });

    // если массив персонажей компьютера пустой, выходи из функции
    if (arrayOfEnemies.length === 0) {
      return;
    }

    // персонажей компьютера, у которых в поле атаки есть персонажи игрока, записываем в массив объектов, где каждому персонажу компьютера приписываем его оппонентов
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

    // определяем случайного персонажа компьютера, который может атаковать. Если такой есть, то определяем случайного персонажа игрока, который может быть им атакован и атакуем
    const attackerObj = canAttackEnemies[Math.floor(Math.random() * canAttackEnemies.length)];
    if (attackerObj) {
      const defender =
        attackerObj.defenders[Math.floor(Math.random() * attackerObj.defenders.length)];
      this.attackTheEnemy(attackerObj.attacker, defender);
    } else {
      // Если никто из персонажей компьютера не может атаковать, тогда выбираем любого и ходим им
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

  // функция, делающая шаг персонажем. Принимает на вход персонажа и индекс ячейки, куда нужно переместиться
  makeStep(char, index) {
    this.players = [...this.players].filter((el) => el !== char);
    char.position = index;
    this.players.push(char);
    this.endOfTurn();
  }

  // функция перехода на следующий уровень
  nextLevel() {
    this.currentLevel += 1;
    if (this.currentLevel < 5) {
      GamePlay.showMessage('START NEW LEVEL!');
    } else {
      this.currentLevel = 4;
      this.endOfGame();
      GamePlay.showMessage('YOU WIN THE GAME!');
      return;
    }
    this.gamePlay.drawUi(themes[this.currentLevel - 1]);
    // считаем очки
    this.scores += this.players.reduce((acc, prev) => {
      if (prev.character.isPlayer) {
        acc += prev.character.health;
      }
      return acc;
    }, 0);
    this.record = Math.max(this.record, this.scores);
    this.renderScores();
    // апаем оставшихся в живых персонажей
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

  // функция повышения статов персонажей компьютера, соответствующих его уровню
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
    this.unsubscriber(); // отписываемся от событий, чтобы заблокироват поле
    this.scores += this.players.reduce((acc, prev) => {
      if (prev.character.isPlayer) {
        acc += prev.character.health;
      }
      return acc;
    }, 0);
    this.record = Math.max(this.record, this.scores);
    this.renderScores(); // перезаписываем очки и рекорд
    this.gamePlay.redrawPositions(this.players); // перерисовываем персонажей
  }

  onNewGame() {
    // отписываемся от старых подписок, обнуляем все переменные, формируем заново команды и подписываемся на события
    this.unsubscriber();
    this.prepareTheGame();
    this.renderScores();
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
    this.selectChar = null;
    const state = GameState.from(this.stateService.load());
    if (!state) {
      GamePlay.showError('Error of load');
      return;
    }

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
    this.renderScores();
  }

  renderScores() {
    const levelElement = this.gamePlay.container.querySelector('#level');
    const scoresElement = this.gamePlay.container.querySelector('#scores');
    const recordElement = this.gamePlay.container.querySelector('#record');
    levelElement.textContent = this.currentLevel;
    scoresElement.textContent = this.scores;
    this.record = Math.max(this.record, this.scores);
    recordElement.textContent = this.record;
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

  unsubscriber() {
    this.gamePlay.unsubscribe();
  }
}
