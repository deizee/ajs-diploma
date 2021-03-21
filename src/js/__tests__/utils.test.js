import {
  calcTileType,
  calcHealthLevel,
  getArrayOfPositions,
  isStepPossible,
  isAttackPossible,
} from '../utils';

test.each([
  [0, 'top-left'],
  [3, 'top'],
  [7, 'top-right'],
  [24, 'left'],
  [28, 'center'],
  [31, 'right'],
  [56, 'bottom-left'],
  [60, 'bottom'],
  [63, 'bottom-right'],
])('Функция calcTileType возвращает правильный тип ячейки', (index, expected) => {
  expect(calcTileType(index)).toBe(expected);
});

test.each([
  [10, 'critical'],
  [30, 'normal'],
  [60, 'high'],
])('Функция calcHealthLevel возвращает правильный показатель здоровья', (health, expected) => {
  expect(calcHealthLevel(health)).toBe(expected);
});

test.each([
  ['user', [0, 1, 8, 9, 16, 17, 24, 25, 32, 33, 40, 41, 48, 49, 56, 57]],
  ['computer', [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63]],
])('Функция getArrayOfPositions возвращает правильный массив индексов ячеек', (type, arr) => {
  expect(getArrayOfPositions(type)).toEqual(arr);
});

test.each([
  [0, 1, 1, { success: true, validCells: [1, 8, 9] }],
  [0, 47, 1, { success: false, validCells: [1, 8, 9] }],
])(
  'Функция isStepPossible правильно определяет возможность хода и массив доступных для хода ячеек',
  (curPos, nextPos, step, expected) => {
    expect(isStepPossible(curPos, nextPos, step)).toEqual(expected);
  }
);

test.each([
  [0, 1, 1, true],
  [0, 47, 1, false],
])(
  'Функция isAttackPossible правильно определяет возможность атаки',
  (curPos, enemyPos, range, bool) => {
    expect(isAttackPossible(curPos, enemyPos, range)).toBe(bool);
  }
);
