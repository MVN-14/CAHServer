export class Player {
  ready: boolean = false;
  playedCard: boolean = false;
  
  constructor (public name: string, public socketId: string) {
  }
}
