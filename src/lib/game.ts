import { Deck, Player } from './';

export class Game {
  started: boolean = false;
  status: string = "";
  players: Player[] = [];
  playedCards: {socketId: string, card: string}[] = [];
  prompt?: {text: string, pick: number};

  get playersNeeded(): number { return this._minPlayers - this.players.length; }
  get allReady(): boolean { return this.readyCount == this.players.length; }
  get readyCount(): number { return this.players.filter(p => p.ready).length }
  get playerCount(): number { return this.players.length; }

  private _deck: Deck = new Deck();
  private _czarIdx = 0;
  private _minPlayers = 3;

  start(): void {
    this.started = true;
    this.players[this._czarIdx++].isCzar = true;
    this.prompt = this._deck.drawBlackCard();
    this.status = "Game starting..."
  }

  addPlayer(player: Player): void {
    this.players.push(player);
  }

  readyPlayer(socketId: string): void {
    const player = this.findPlayer(socketId);
    player.ready = true;
  }

  playCard(socketId: string, card: string): void {
    const player = this.findPlayer(socketId);
    
    player.cards = player.cards.filter(c => c !== card);
    this.playedCards.push({socketId, card});
    player.playedCard = true;
  }

  drawWhiteCards(amount: number, socketId: string): void {
    const player = this.findPlayer(socketId);

    for (let i = 0; i < amount; ++i) {
      player?.cards.push(this._deck.drawWhiteCard());
    };
  }

  removePlayer(socketId: string): void {
    this.players = this.players.filter(p => p.socketId !== socketId);
  }

  private findPlayer(socketId: string): Player {
    const player = this.players.find(p => p.socketId === socketId);
    if(!player) {
      throw new Error(`Failed to find player with socketId ${socketId}`);
    }

    return player;
  }

}
