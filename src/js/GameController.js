import themes from './themes';
import Team from './Team';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.userTeam = generateTeam(new Team().userTeam, 1, 2);
    this.computerTeam = generateTeam(new Team().computerTeam, 1, 2);
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.drawUi(themes.prairie);

    const userCoordinates = [0, 1, 8, 9, 16, 17, 24, 25, 32, 33, 40, 41, 48, 49, 56, 57];
    const compCoordinates = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];

    const userTeamWithPositions = this.userTeam.map(
      (el) =>
        new PositionedCharacter(
          el,
          userCoordinates[Math.floor(Math.random() * (userCoordinates.length - 1))]
        )
    );
    const computerTeamWithPositions = this.computerTeam.map(
      (el) =>
        new PositionedCharacter(
          el,
          compCoordinates[Math.floor(Math.random() * (compCoordinates.length - 1))]
        )
    );

    const positions = userTeamWithPositions.concat(computerTeamWithPositions);
    this.gamePlay.redrawPositions(positions); // positions - массив из объектов PositionedCharacter
  }

  onCellClick(index) {
    // TODO: react to click
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
  }
}
