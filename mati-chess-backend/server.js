const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*", // Permite que tu app de React se conecte
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  // Cuando un jugador se une a una sala específica
  socket.on("unirse_partida", ({ idSala }) => {
    socket.join(idSala);
    console.log(`Jugador ${socket.id} se unió a la sala: ${idSala}`);
  });

  // Cuando un jugador mueve una pieza, reenvía al otro jugador
  socket.on("mover_pieza", ({ idSala, nuevoTablero }) => {
    socket.to(idSala).emit("tablero_actualizado", nuevoTablero);
    console.log(`Movimiento recibido en sala ${idSala}`);
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado");
  });
});

// Asegúrate de que el servidor escuche en '0.0.0.0' en lugar de omitirlo
const PORT = process.env.PORT || 3001;
// Y asegurate de que tu app escuche en ese puerto:
server.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
