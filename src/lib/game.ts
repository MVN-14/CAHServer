import { Deck, Player, Card } from './';

export class Game {
  started: boolean = false;
  status: string = "";
  statusMessage: string = "";
  players: Player[] = [];
  playedCards: Card[] = [];
  prompt?: { text: string, pick: number };
  choosing: boolean = false;

  get playersNeeded(): number { return this._minPlayers - this.players.length; }
  get allReady(): boolean { return this.readyCount == this.players.length; }
  get readyCount(): number { return this.players.filter(p => p.ready).length }
  get playerCount(): number { return this.players.length; }
  get allCardsPlayed(): boolean {
    for (let i = 0; i < this.players.length; ++i) {
      if (!this.players[i].isCzar && this.players[i].playedCards !== this.prompt?.pick) {
        return false;
      }
    }
    return true;
  }
  get allCardsRevealed(): boolean {
    let result = true;
    this.playedCards.forEach(c => {
      if(c.faceDown) {
        result = false;
        return;
      }
    });
    return result;
  }

  private _deck: Deck = new Deck();
  private _czarIdx = 0;
  private _minPlayers = 3;
  private _maxCards = 7;

  start(): void {
    this.started = true;
    this.players[this._czarIdx++].isCzar = true;
    this.prompt = this._deck.drawBlackCard();
    this.statusMessage = "Game starting..."
    this.players.forEach(({socketId}) => {
      this.drawWhiteCards(socketId)
    })
  }

  addPlayer(player: Player): void {
    this.players.push(player);
  }

  readyPlayer(socketId: string): void {
    const player = this.findPlayer(socketId);
    player.ready = true;
  }

  playCard(socketId: string, text: string): void {
    const player = this.findPlayer(socketId);
    if (player.playedCards == this.prompt?.pick) {
      return;
    }

    player.cards = player.cards.filter(c => c !== text);
    this.playedCards.push({ socketId, text, faceDown: true });
        ++player.playedCards;
  }

  revealCard(card: Card): void {
    const revealedCard = this.playedCards.find(c => c.socketId === card.socketId);
    if(!revealedCard) { return };
    revealedCard.faceDown = false;
  }

  selectCard(card: Card): void {
    const player = this.players.find(p => p.socketId === card.socketId);
    if(!player) { return; }
    
    ++player.points;
    this.setupNextTurn();
  }

  drawWhiteCards(socketId: string): void {
    const player = this.findPlayer(socketId);
    const cardsToDraw =  this._maxCards - player.cards.length;

    for (let i = 0; i < cardsToDraw; ++i) {
      player?.cards.push(this._deck.drawWhiteCard());
    };
  }

  removePlayer(socketId: string): void {
    this.players = this.players.filter(p => p.socketId !== socketId);
  }

  private findPlayer(socketId: string): Player {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) {
      throw new Error(`Failed to find player with socketId ${socketId}`);
    }

    return player;
  }

  private setupNextTurn() {
    this.playedCards = [];
    this.statusMessage = "Starting next round...";
    this.players.forEach((p) => {
      p.playedCards = 0;
      p.isCzar = false;
    });
    this.players[this._czarIdx++].isCzar = true;
    this.prompt = this._deck.drawBlackCard();
    this.status = "";
  }

}
