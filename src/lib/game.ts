import { Deck, Player } from './';

export class Game {
  players: Player[] = [];
  started: boolean = false;
  deck: Deck = new Deck();
  
  private _czarIdx = 0;

  start() {
    this.started = true;
    this.players[this._czarIdx++].isCzar = true;
  }

  setReady(socketId: string) {
    const player = this.players.find(p => p.socketId === socketId);
    if(!player) return;

    player.ready = true;
  }
  
  setPlayedCard(socketId: string) {
    const player = this.players.find(p => p.socketId === socketId);
    if(!player) return;

    player.playedCard = true;
   }
  
  removePlayer(socketId: string) {
    this.players = this.players.filter(p => p.socketId !== socketId);
  }

  getReadyCount() {
    return this.players.filter(p => p.ready).length;
  }
}
