import { Deck, Player } from './';

export class Game {
  players: Player[] = [];
  status: string = "";
  deck: Deck = new Deck();

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
    this.players = this.players.filter(p => p.socketId == socketId);
  }

  getReadyCount() {
    return this.players.filter(p => p.ready).length;
  }
}
