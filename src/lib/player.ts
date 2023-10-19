export class Player {
  ready: boolean = false;
  playedCard: boolean = false;
  isCzar: boolean = false;
  cards: string[] = [];
  
  constructor (public name: string, public socketId: string) {
  }
}
