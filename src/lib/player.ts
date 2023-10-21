export class Player {
  ready: boolean = false;
  playedCards: number = 0;
  isCzar: boolean = false;
  cards: string[] = [];
  points: number = 0;

  constructor (public name: string, public socketId: string) {
  }
}
