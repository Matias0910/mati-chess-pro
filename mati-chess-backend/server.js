const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

app.get('/', (req, res) => res.send('Chess backend running'));
app.get('/health', (req, res) => res.json({ status: 'ok', source: 'mati-chess-backend' }));

// Configuración de CORS para que tu frontend en Vercel pueda conectar
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexiones desde cualquier lugar (Vercel, Local, etc.)
    methods: ["GET", "POST"]
  },
  pingInterval: 20000, // El servidor envía un ping cada 20 segundos
  pingTimeout: 30000   // El servidor espera 30 segundos por un pong
});

io.on('connection', (socket) => {
  console.log('🚀 NUEVA CONEXIÓN DETECTADA - ID:', socket.id);

  // El usuario se une a una sala específica
  socket.on('join_sala', (idSala) => {
    socket.join(idSala);
    console.log(`🏠 SALA: Usuario ${socket.id} se unió a [${idSala}]`);
  });

  // Recibe el movimiento y lo reenvía a los demás en la sala
  socket.on('mover_pieza', (data) => {
    if (!data || !data.idSala || !data.nuevoTablero) return;
    const { idSala, nuevoTablero } = data;

    console.log(`📦 MOVIMIENTO RECIBIDO - Sala: ${idSala} - Enviando a otros...`);
    socket.to(idSala).emit('movimiento_recibido', nuevoTablero);
  });

  socket.on('disconnect', () => {
    console.log('❌ USUARIO DESCONECTADO - ID:', socket.id);
  });
});

// Render asigna el puerto automáticamente vía process.env.PORT
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Servidor de ajedrez corriendo en puerto ${PORT}`);
});