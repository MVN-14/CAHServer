import { Server } from 'socket.io';
import { Game, Player } from './lib';

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
    if(!game.started) {  
    if (game.playersNeeded > 0) {
      game.status = `Waiting for ${game.playersNeeded} more players...`;
    } else {
        game.status = `${game.readyCount}/${game.playerCount} ready`
      }
    }

    io.to(roomName).emit("updateGame", game);
  })

  socket.on("ready", () => {
    const game = getGame(socket.data.roomName);
    if(game.started) { return; }

    game.readyPlayer(socket.id);
    if (game.allReady) {
      game.start();
    } else {
      game.status = `${game.readyCount}/${game.playerCount} ready`;
    }
    io.emit("updateGame", game);
  })

  socket.on("playedCard", (card: string) => {
    const game = getGame(socket.data.roomName);

    game.playCard(socket.id, card);
    io.emit("updateGame", game);
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
    
    if(!game.started) {
      if (game.playersNeeded > 0) {
        game.status = `Waiting for ${game.playersNeeded} more players...`;
      } else if (!game.allReady) {
        game.status = `${game.readyCount}/${game.playerCount} ready`;
      }
    }

    io.emit("updateGame", game);
  })

  socket.on("drawCards", (amount: number) => {
    const game = getGame(socket.data.roomName);

    game.drawWhiteCards(amount, socket.id);
    io.to(socket.id).emit("updateGame", game);
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

