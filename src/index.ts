import { Server } from 'socket.io';
import { Card, Game, Player } from './lib';

const PORT: number = Number.parseInt(process.env.port || "6969");
const io = new Server({
  cors: {
    origin: ["http://localhost:5173", "https://cah.mnogueira.ca"],
  }
});

const rooms = new Map<string, Game>;

io.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.on("joinRoom", ({ roomName, username }) => {
    socket.data.roomName = roomName;
    socket.join(roomName);

    let game = rooms.get(roomName);
    if (!game) {
      game = new Game();
      rooms.set(roomName, game);
    }

    game.addPlayer(new Player(username, socket.id));
    if (!game.started) {
      if (game.playersNeeded > 0) {
        game.statusMessage = `Waiting for ${game.playersNeeded} more players...`;
      } else {
        game.statusMessage = `${game.readyCount}/${game.playerCount} ready`
      }
    }

    io.to(roomName).emit("updateGame", game);
  })

  socket.on("ready", () => {
    const game = getGame(socket.data.roomName);
    if (game.started) { return; }

    game.readyPlayer(socket.id);
    if (game.allReady) {
      game.start();
    } else {
      game.statusMessage= `${game.readyCount}/${game.playerCount} ready`;
    }
    io.to(socket.data.roomName).emit("updateGame", game);
  })

  socket.on("playedCard", (card: string) => {
    const game = getGame(socket.data.roomName);

    game.playCard(socket.id, card);

    if (game.allCardsPlayed) {
      game.statusMessage= "All cards played, waiting for czar to read cards..."
      game.status = "reading";
    } else {
      game.statusMessage = `Waiting for ${game.playerCount - 1 - game.playedCards.length} more cards`
    }
    io.to(socket.data.roomName).emit("updateGame", game);
  })

  socket.on("revealCard", (card: Card) => {
    const game = getGame(socket.data.roomName);

    game.revealCard(card);
    if(game.allCardsRevealed) {
      game.statusMessage = `All cards revealed, czar selecting winner...`;
      game.status = "selecting";
    }
    io.to(socket.data.roomName).emit("updateGame", game);
  })

  socket.on("selectCard", (card: Card) => {
    const game = getGame(socket.data.roomName);

    game.selectCard(card);
    io.to(socket.data.roomName).emit("updateGame", game);
  })

  socket.on("disconnect", () => {
    const game = getGame(socket.data.roomName);

    game.removePlayer(socket.id);
    if (game.players.length === 0) {
      rooms.delete(socket.data.roomName);
      console.log(`Deleted room ${socket.data.roomName}`);
      return;
    }
    console.log(`Socket ${socket.id} disconnected`);

    if (!game.started) {
      if (game.playersNeeded > 0) {
        game.statusMessage = `Waiting for ${game.playersNeeded} more players...`;
      } else if (!game.allReady) {
        game.statusMessage = `${game.readyCount}/${game.playerCount} ready`;
      }
    }

    io.to(socket.data.roomName).emit("updateGame", game);
  })

  socket.on("drawCards", () => {
    const game = getGame(socket.data.roomName);

    game.drawWhiteCards(socket.id);
    io.to(socket.data.roomName).emit("updateGame", game);
  })
});

io.listen(PORT);
console.log(`Socket server listening on port ${PORT}`)

function getGame(roomName: string): Game {
  const game = rooms.get(roomName);
  if (!game) {
    throw new Error(`Couldn't get game for room ${roomName}`);
  }
  return game;
}

