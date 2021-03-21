import PositionedCharacter from '../PositionedCharacter';
import Bowman from '../Bowman';

test('Если в PositionedCharacter передать объект, который не наследуется от Character, то будет выброшена ошибка', () => {
  const obj = {};
  expect(() => new PositionedCharacter(obj, 1)).toThrow();
});

test('Если в PositionedCharacter вторым параметром передать не числовой тип, будет выброшена ошибка', () => {
  const bowman = new Bowman(1);
  expect(() => new PositionedCharacter(bowman, '1')).toThrow();
});
