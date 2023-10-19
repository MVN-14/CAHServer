import { Server } from 'socket.io';
import { Game, Player } from './lib';

const PORT: number = Number.parseInt(process.env.port || "6969");
const io = new Server({
  cors: {
    origin: ["http://localhost:5173", "https://cah.mnogueira.ca"],
  }
});

const rooms = new Map<string, Game>;

const minPlayers = 3;

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

    game.players.push(new Player(username, socket.id));

    io.to(roomName).emit("updatePlayers", game.players);
    if(!game.started) {
      serverMessage(roomName);
    }
  })

  socket.on("ready", () => {
    const game = rooms.get(socket.data.roomName);
    if (!game) { return; }

    game.setReady(socket.id);
    serverMessage(socket.data.roomName);
  })

  socket.on("cardPlayed", (card: string) => {
    const game = rooms.get(socket.data.roomName);
    if (!game) { return; }

    game.setPlayedCard(socket.id);
    io.emit("updatePlayers", game.players);

  })

  socket.on("requestWhiteCards", (amount: number) => {
    const game = rooms.get(socket.data.roomName);
    if (!game) { return; }

    const cards: string[] = [];
    for (let i = 0; i < amount; ++i) {
      cards.push(game.deck.drawWhiteCard());
    }
    io.to(socket.id).emit("recieveWhiteCards", cards);
  })

  socket.on("disconnect", () => {
    const game = rooms.get(socket.data.roomName);
    if (!game) { return; }

    game.removePlayer(socket.id);
    console.log(`Socket ${socket.id} disconnected`);
    io.emit("updatePlayers", game.players);
    serverMessage(socket.data.roomName);
  })
});

io.listen(PORT);
console.log(`Socket server listening on port ${PORT}`)

function serverMessage(roomName: string) {
  const game = rooms.get(roomName);
  if (!game) { return; }
  
  if (game.players.length < minPlayers) {
    io.emit("serverMessage", `Waiting for ${minPlayers - game.players.length} more players to join...`);
  } else if (game.getReadyCount() < game.players.length) {
    io.emit("serverMessage", `${game.getReadyCount()}/${game.players.length} ready...`);
  } else {
    io.emit("serverMessage", "Starting game...");
    startGame(roomName);
  }
}

function startGame(roomName: string) {
  const game = rooms.get(roomName);
  if (!game) { return; }
 
  game.start();
  io.emit("start");
  io.emit("prompt", game.deck.drawBlackCard());
  io.emit("serverMessage", "Waiting for players...");
  io.emit("updatePlayers", game.players)
}


