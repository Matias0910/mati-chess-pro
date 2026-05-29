const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

// Configuración de CORS para que tu frontend en Vercel pueda conectar
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // El usuario se une a una sala específica
  socket.on('join_sala', (idSala) => {
    socket.join(idSala);
    console.log(`Usuario ${socket.id} se unió a la sala: ${idSala}`);
  });

  // Recibe el movimiento de un celular y lo envía al otro
  socket.on('mover_pieza', (data) => {
    // data debe tener { idSala, nuevoTablero }
    console.log('Movimiento en sala:', data.idSala);
    // Enviamos a todos en la sala EXCEPTO al que hizo el movimiento
    socket.to(data.idSala).emit('movimiento_recibido', data.nuevoTablero);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Render asigna el puerto automáticamente vía process.env.PORT
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Servidor de ajedrez corriendo en puerto ${PORT}`);
});