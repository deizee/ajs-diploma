export function calcTileType(index, boardSize) {
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

export function getArrayOfPositions(type, boardSize) {
  const array = [];
  if (type === 'user') {
    for (let i = 0; i < boardSize ** 2; i += 1) {
      if (i % boardSize === 0 || (i - 1) % boardSize === 0) {
        array.push(i);
      }
    }
  }
  if (type === 'computer') {
    for (let i = 0; i < boardSize ** 2; i += 1) {
      if ((i + 1) % boardSize === 0 || (i + 2) % boardSize === 0) {
        array.push(i);
      }
    }
  }

  return array;
}
