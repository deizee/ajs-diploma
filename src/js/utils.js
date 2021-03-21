export function calcTileType(index, boardSize = 8) {
  // TODO: write logic here
  if (index === 0) {
    return 'top-left';
  }
  if (index === boardSize - 1) {
    return 'top-right';
  }
  if (index < boardSize) {
    return 'top';
  }
  if (index === boardSize * (boardSize - 1)) {
    return 'bottom-left';
  }
  if (index % boardSize === 0) {
    return 'left';
  }
  if (index === boardSize ** 2 - 1) {
    return 'bottom-right';
  }
  if ((index + 1) % boardSize === 0) {
    return 'right';
  }
  if (index > boardSize * (boardSize - 1)) {
    return 'bottom';
  }
  return 'center';
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}

export function getArrayOfPositions(type, boardSize = 8) {
  const array = [];
  if (type === 'user') {
    for (let i = 0; i < boardSize ** 2; i++) {
      if (i % boardSize === 0 || (i - 1) % boardSize === 0) {
        array.push(i);
      }
    }
  }
  if (type === 'computer') {
    for (let i = 0; i < boardSize ** 2; i++) {
      if ((i + 1) % boardSize === 0 || (i + 2) % boardSize === 0) {
        array.push(i);
      }
    }
  }

  return array;
}

function genetateCoordinates(boardSize = 8) {
  return new Array(64)
    .fill(0)
    .map((el, index) => index++)
    .map((el, i) => ({ x: i % boardSize, y: Math.floor(i / boardSize) }));
}

/**
 * Checks the validity of the cell for the next step
 *
 * @param {Number} curPosition position of current character
 * @param {Number} nextPosition next position of current character
 * @param {Number} step allowable step of current character
 * @param {Number} boardSize
 * @returns boolean (true if step is possible)
 */
export function isStepPossible(curPosition, nextPosition, step, boardSize = 8) {
  const coordinates = genetateCoordinates(boardSize);
  const currentXY = coordinates[curPosition];
  const nextXY = coordinates[nextPosition];

  const arrayOfValidCell = [];
  for (let i = 1; i <= step; i++) {
    arrayOfValidCell.push(
      [currentXY.x - i, currentXY.y - i],
      [currentXY.x, currentXY.y - i],
      [currentXY.x - i, currentXY.y],
      [currentXY.x + i, currentXY.y - i],
      [currentXY.x + i, currentXY.y],
      [currentXY.x - i, currentXY.y + i],
      [currentXY.x, currentXY.y + i],
      [currentXY.x + i, currentXY.y + i]
    );
  }

  const indexsesOfValidCells = arrayOfValidCell
    .filter((el) => el[0] >= 0 && el[1] >= 0 && el[0] <= 7 && el[1] <= 7)
    .map((el) => el[0] + el[1] * 8);

  return {
    success: arrayOfValidCell.some(
      (coordinate) => coordinate[0] === nextXY.x && coordinate[1] === nextXY.y
    ),
    validCells: indexsesOfValidCells,
  };
}

/**
 * Checks the validity of the cell for the attack
 *
 * @param {Number} curPosition position of current character
 * @param {Number} enemyPosition position of the enemy
 * @param {Number} range range of attack
 * @param {Number} boardSize
 * @returns boolean (true if attack is possible)
 */
export function isAttackPossible(curPosition, enemyPosition, range, boardSize) {
  const coordinates = genetateCoordinates(boardSize);
  const currentXY = coordinates[curPosition];
  const enemyXY = coordinates[enemyPosition];

  const arrayOfValidCell = [];
  for (let y = currentXY.y - range; y <= currentXY.y + range; y++) {
    for (let x = currentXY.x - range; x <= currentXY.x + range; x++) {
      if (x >= 0 && x <= 7 && y >= 0 && y <= 7) {
        arrayOfValidCell.push({ x, y });
      }
    }
  }

  return arrayOfValidCell.some(
    (coordinate) => coordinate.x === enemyXY.x && coordinate.y === enemyXY.y
  );
}
