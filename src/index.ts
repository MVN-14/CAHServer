import { Server } from 'socket.io';
import { Deck } from './cards';

const PORT: number = Number.parseInt(process.env.port || "6969");
const io = new Server({
  cors: {
    origin: ["http://localhost:5173"],
  }
});

const users: Map<string, string[]> = new Map<string, string[]>;
const deck: Deck = new Deck();

io.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.on("joinRoom", ({ roomName, username }) => {
    socket.data.roomName = roomName;
    socket.data.username = username;
    socket.join(roomName);
    if (!users.has(roomName)) {
      users.set(roomName, []);
    }
    users.get(roomName)?.push(username);
    io.to(roomName).emit("updatePlayers", users.get(roomName))
  })
  
  socket.on("ready", () => {
    
  })

  socket.on("requestWhiteCards", (amount: number) => {
    const cards: string[] = [];
    for (let i = 0; i < amount; ++i) {
      cards.push(deck.drawWhiteCard());
    }
    io.to(socket.id).emit("recieveWhiteCards", cards);
  })

  socket.on("disconnect", () => {
    users.set(socket.data.roomName, users.get(socket.data.roomName)?.filter(u => u !== socket.data.username) ?? []);
    console.log(`Socket ${socket.id} disconnected`);
    io.emit("updatePlayers", users.get(socket.data.roomName));
  })

});

io.listen(PORT);
console.log(`Socket server listening on port ${PORT}`)

