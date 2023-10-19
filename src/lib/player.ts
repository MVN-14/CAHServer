export class Player {
  ready: boolean = false;
  playedCards: number = 0;
  isCzar: boolean = false;
  cards: string[] = [];
  
  constructor (public name: string, public socketId: string) {
  }
}
