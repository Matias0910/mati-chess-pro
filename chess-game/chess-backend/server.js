const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('unirse_sala', (sala) => {
    socket.join(sala);
    console.log(`Usuario ${socket.id} entró en: ${sala}`);
  });

  socket.on('movimiento', ({ sala, fen }) => {
    socket.to(sala).emit('movimiento', fen);
  });
});

http.listen(3001, () => console.log('Servidor de Ajedrez Online activo en puerto 3001'));