import GameController from '../GameController';
import GamePlay from '../GamePlay';
import GameStateService from '../GameStateService';
import Bowman from '../Bowman';
import Daemon from '../Daemon';
import PositionedCharacter from '../PositionedCharacter';

let gamePlay = null;
let stateService = null;
let gameCtrl = null;

beforeEach(() => {
  const container = document.createElement('div');
  container.setAttribute('id', 'game-container');
  gamePlay = new GamePlay();
  gamePlay.bindToDOM(container);
  stateService = new GameStateService(localStorage);
  gameCtrl = new GameController(gamePlay, stateService);

  gameCtrl.init();
  gameCtrl.players = [
    new PositionedCharacter(new Bowman(1), 0),
    new PositionedCharacter(new Daemon(1), 1),
  ];
  gameCtrl.gamePlay.redrawPositions(gameCtrl.players);
});

test('Проверяем, что срабатывает метод showCellTooltip при наведении на ячейку', () => {
  gameCtrl.gamePlay.showCellTooltip = jest.fn();
  gameCtrl.onCellEnter(0);

  expect(gameCtrl.gamePlay.showCellTooltip).toBeCalled();
});

test('Проверяем что при наведении на пустую ячейку вызывается метод setCursor с правильными параметрами', () => {
  gameCtrl.gamePlay.showCellTooltip = jest.fn();
  gameCtrl.gamePlay.setCursor = jest.fn();
  gameCtrl.onCellEnter(2);
  expect(gameCtrl.gamePlay.setCursor).toHaveBeenCalledWith('auto');
});

test('Метод onCellEnter проверяет доступность перемещения в указанную ячейку, если можно, то вызываются методы selectCell и setCursor', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.gamePlay.selectCell = jest.fn();
  gameCtrl.gamePlay.setCursor = jest.fn();
  gameCtrl.onCellEnter(8);
  expect(gameCtrl.gamePlay.selectCell).toHaveBeenCalledWith(8, 'green');
  expect(gameCtrl.gamePlay.setCursor).toHaveBeenCalledWith('pointer');
});

test('Метод onCellEnter проверяет доступность перемещения в указанную ячейку, если нельзя, то метод selectCell вызван не будет', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.gamePlay.selectCell = jest.fn();
  gameCtrl.onCellEnter(38);
  expect(gameCtrl.gamePlay.selectCell).toBeCalledTimes(0);
});

test('Метод onCellEnter проверяет, если доступна атака, вызывай методы selectCell и setCursor с правильными параметрами', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.gamePlay.selectCell = jest.fn();
  gameCtrl.gamePlay.setCursor = jest.fn();
  gameCtrl.onCellEnter(1);

  expect(gameCtrl.gamePlay.selectCell).toHaveBeenCalledWith(1, 'red');
  expect(gameCtrl.gamePlay.setCursor).toHaveBeenCalledWith('crosshair');
});

test('Метод onCellEnter проверяет, если нельзя атаковать, то  будет вызван setCursor с правильными параметрами', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.selectChar.position = 48;
  gameCtrl.gamePlay.setCursor = jest.fn();
  gameCtrl.onCellEnter(1);

  expect(gameCtrl.gamePlay.setCursor).toHaveBeenCalledWith('not-allowed');
});

test('Метод onCellClick проверяет, если в ячейке есть персонаж и он игрок, то вызывай метод selectCell', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.gamePlay.selectCell = jest.fn();
  gameCtrl.onCellClick(0);
  expect(gameCtrl.gamePlay.selectCell).toBeCalled();
});

test('Метод onCellClick проверяет, если нет выбранного персонажа, и в ячейке есть персонаж, и он не игрок, то вызывается метод showError', () => {
  GamePlay.showError = jest.fn();
  gameCtrl.onCellClick(1);
  expect(GamePlay.showError).toBeCalledTimes(1);
});

test('Метод onCellClick проверяет, если возможно ли переместится в данную ячейку, то перемещаемся', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.stepIsPossible = true;
  gameCtrl.makeStep = jest.fn();
  gameCtrl.onCellClick(8);
  expect(gameCtrl.makeStep).toHaveBeenCalledWith(gameCtrl.selectChar, 8);
});

test('Метод onCellClick проверяет, если переместится в данную ячейку невозможно, то метод makeStep не вызывается', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.stepIsPossible = false;
  gameCtrl.makeStep = jest.fn();
  gameCtrl.onCellClick(32);
  expect(gameCtrl.makeStep).toBeCalledTimes(0);
});

test('Метод onCellClick проверяет, eсли атака доступна, атакуем', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.attackIsPossible = true;
  gameCtrl.attackTheEnemy = jest.fn();
  gameCtrl.onCellClick(1);
  expect(gameCtrl.attackTheEnemy).toHaveBeenCalledWith(gameCtrl.selectChar, gameCtrl.players[1]);
});

test('Метод onCellClick проверяет, eсли атаковать нельзя, то метод attackTheEnemy не вызывается', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.players[1].position = 42;
  gameCtrl.attackIsPossible = false;
  gameCtrl.attackTheEnemy = jest.fn();
  gameCtrl.onCellClick(42);
  expect(gameCtrl.attackTheEnemy).toBeCalledTimes(0);
});

test('Метод onCellLeave вызывает hideCellTooltip', () => {
  gameCtrl.gamePlay.hideCellTooltip = jest.fn();
  gameCtrl.onCellLeave(1);
  expect(gameCtrl.gamePlay.hideCellTooltip).toBeCalled();
});

test('Метод onNewGame вызывает prepareTheGame, renderScore, onCellClickSubscriber, onCellEnterSubscriber, onCellLeaveSubscriber', () => {
  gameCtrl.prepareTheGame = jest.fn();
  gameCtrl.renderScores = jest.fn();
  gameCtrl.onCellClickSubscriber = jest.fn();
  gameCtrl.onCellEnterSubscriber = jest.fn();
  gameCtrl.onCellLeaveSubscriber = jest.fn();
  gameCtrl.onNewGame();
  expect(gameCtrl.prepareTheGame).toBeCalled();
  expect(gameCtrl.renderScores).toBeCalled();
  expect(gameCtrl.onCellClickSubscriber).toBeCalled();
  expect(gameCtrl.onCellEnterSubscriber).toBeCalled();
  expect(gameCtrl.onCellLeaveSubscriber).toBeCalled();
});

test('Метод onSaveGame вызывает метод save', () => {
  gameCtrl.stateService.save = jest.fn();
  gameCtrl.onSaveGame();
  expect(gameCtrl.stateService.save).toBeCalled();
});

test('Должен ловить ошибку', () => {
  GamePlay.showError = jest.fn();
  gameCtrl.stateService.storage = { getItem: () => new Error() };
  expect(() => gameCtrl.onLoadGame()).toThrow();
});

test('Метод onLoadGame вызывает методы gamePlay.redrawPositions, renderScores и drawUi', () => {
  gameCtrl.gamePlay.drawUi = jest.fn();
  gameCtrl.gamePlay.redrawPositions = jest.fn();
  gameCtrl.renderScores = jest.fn();
  gameCtrl.onSaveGame();
  gameCtrl.onLoadGame();
  expect(gameCtrl.gamePlay.drawUi).toBeCalled();
  expect(gameCtrl.gamePlay.redrawPositions).toBeCalled();
  expect(gameCtrl.renderScores).toBeCalled();
});

test('Метод attackTheEnemy вызывает метод showDamage, если здоровье противника больше 0', () => {
  gameCtrl.gamePlay.showDamage = jest.fn(() => Promise.resolve('test'));
  gameCtrl.attackTheEnemy(gameCtrl.players[1], gameCtrl.players[0]);
  expect(gameCtrl.gamePlay.showDamage).toBeCalled();
});

test('Метод attackTheEnemy вызывает метод endOfTurn, если здоровье противника <= 0', () => {
  gameCtrl.endOfTurn = jest.fn();
  gameCtrl.players[0].character.health = 0;
  gameCtrl.attackTheEnemy(gameCtrl.players[1], gameCtrl.players[0]);
  expect(gameCtrl.endOfTurn).toBeCalled();
});

test('Метод endOfTurn вызывает метод deselectCell', () => {
  gameCtrl.gamePlay.deselectCell = jest.fn();
  gameCtrl.endOfTurn();
  expect(gameCtrl.gamePlay.deselectCell).toBeCalled();
});

test('Метод endOfTurn должен обнулять выбранного персонажа, если его здоровье < 0', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.selectChar.character.health = 0;
  gameCtrl.gamePlay.setCursor = jest.fn();
  gameCtrl.gamePlay.redrawPositions = jest.fn();
  gameCtrl.computerTurn = jest.fn();
  gameCtrl.endOfTurn();
  expect(gameCtrl.selectChar).toBe(null);
});

test('Метод endOfTurn проверяет, если массив персонажей компьютера пустой, переходим на следующий уровень', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.players.splice(1, 1);
  gameCtrl.nextLevel = jest.fn();
  gameCtrl.gamePlay.setCursor = jest.fn();
  gameCtrl.gamePlay.redrawPositions = jest.fn();
  gameCtrl.computerTurn = jest.fn();
  gameCtrl.endOfTurn();
  expect(gameCtrl.nextLevel).toBeCalled();
});

test('Метод endOfTurn проверяет, если массив персонажей игрока пустой, завершаем игру и показываем сообщение о проигрыше', () => {
  gameCtrl.players.splice(0, 1);
  GamePlay.showMessage = jest.fn();
  gameCtrl.endOfGame = jest.fn();
  gameCtrl.endOfTurn();
  expect(GamePlay.showMessage).toHaveBeenCalledWith('You lose...');
});

test('Метод endOfTurn проверяет, если есть выбранный игрок, вызывается метод selectCell (рисуем желтую подсветку)', () => {
  // eslint-disable-next-line prefer-destructuring
  gameCtrl.selectChar = gameCtrl.players[0];
  gameCtrl.nextLevel = jest.fn();
  gameCtrl.gamePlay.selectCell = jest.fn();
  gameCtrl.endOfTurn();
  expect(gameCtrl.gamePlay.selectCell).toHaveBeenCalledWith(gameCtrl.selectChar.position);
});

test('Метод endOfTurn проверяет, если isUserTurn = true, то делай ее false и вызывай computerTurn', () => {
  gameCtrl.isUserTurn = true;
  gameCtrl.computerTurn = jest.fn();
  gameCtrl.endOfTurn();
  expect(gameCtrl.isUserTurn).toBeFalsy();
  expect(gameCtrl.computerTurn).toBeCalled();
});

test('Метод endOfTurn проверяет, если isUserTurn = false, то делай ее true', () => {
  gameCtrl.isUserTurn = false;
  gameCtrl.endOfTurn();
  expect(gameCtrl.isUserTurn).toBeTruthy();
});

test('Метод computerTurn прерывается, если массив персонажей компьютера пустой', () => {
  gameCtrl.players.splice(1, 1);
  expect(gameCtrl.computerTurn()).toBe(undefined);
});

test('Метод computerTurn вызывает метод makeStep, если в зоне видимости компьютерного перосонажа нет противников', () => {
  gameCtrl.players[1].position = 55;
  gameCtrl.makeStep = jest.fn();
  // gameCtrl.isStepPossible = jest.fn(() => 54);
  gameCtrl.computerTurn();
  expect(gameCtrl.makeStep).toBeCalled();
});

test('Метод makeStep вызывает метод endOfTurn', () => {
  gameCtrl.endOfTurn = jest.fn();
  gameCtrl.makeStep(gameCtrl.players[1], 2);
  expect(gameCtrl.endOfTurn).toBeCalled();
});

test('Метод nextLevel должен вызывать метод GamePlay.showMessage с аргументом "START NEW LEVEL!", после окончания 1-3 уровней', () => {
  GamePlay.showMessage = jest.fn();
  gameCtrl.gamePlay.drawUi = jest.fn();
  gameCtrl.renderScores = jest.fn();
  gameCtrl.redrawPositions = jest.fn();
  gameCtrl.currentLevel = 1;
  gameCtrl.nextLevel();
  expect(GamePlay.showMessage).toHaveBeenCalledWith('START NEW LEVEL!');
});

test('Метод nextLevel должен вызывать метод endOfGame и GamePlay.showMessage с аргументом "YOU WIN THE GAME!", после окончания 4 уровня', () => {
  GamePlay.showMessage = jest.fn();
  gameCtrl.endOfGame = jest.fn();
  gameCtrl.currentLevel = 4;
  gameCtrl.nextLevel();
  expect(GamePlay.showMessage).toHaveBeenCalledWith('YOU WIN THE GAME!');
  expect(gameCtrl.endOfGame).toBeCalled();
});

test('Метод statesUpForCompChars должен корректно поднимать статы у компьютерных персонажей в зависимости от их левела', () => {
  const char = gameCtrl.players[1].character;
  char.level = 2;
  const newCharsArr = gameCtrl.statesUpForCompChars([char]);
  expect(newCharsArr[0].attack).toBe(18);
  expect(newCharsArr[0].defence).toBe(72);
});

test('Метод endOfGame должен вызвать unsubscriber, renderScores и redrawPositions', () => {
  gameCtrl.unsubscriber = jest.fn();
  gameCtrl.renderScores = jest.fn();
  gameCtrl.gamePlay.redrawPositions = jest.fn();
  gameCtrl.endOfGame();
  expect(gameCtrl.unsubscriber).toBeCalled();
  expect(gameCtrl.renderScores).toBeCalled();
  expect(gameCtrl.gamePlay.redrawPositions).toBeCalled();
});
