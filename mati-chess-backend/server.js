const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Usuario conectado: ' + socket.id);

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });

  // Aquí va el resto de tu lógica de ajedrez (socket.on('move', ...))
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});