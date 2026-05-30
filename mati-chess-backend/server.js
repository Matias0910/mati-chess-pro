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
  pingInterval: 10000, // Pings más frecuentes para mantener viva la conexión en redes móviles
  pingTimeout: 20000
});

io.on('connection', (socket) => {
  console.log(`🚀 Jugador conectado: ${socket.id} (Total: ${io.engine.clientsCount})`);

  // El usuario se une a una sala específica
  socket.on('join_sala', (idSala) => {
    if (!idSala) return console.error("❌ Intento de unión sin ID de sala");
    socket.join(idSala);
    console.log(`🏠 Sala [${idSala}]: ${socket.id} se ha unido.`);
  });

  // Recibe el movimiento y lo reenvía a los demás en la sala
  socket.on('mover_pieza', (data) => {
    if (!data || !data.idSala || !data.nuevoTablero) {
      console.error("⚠️ Datos de movimiento inválidos:", data);
      return;
    }
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
  console.log(`✅ SERVIDOR ACTIVO en puerto ${PORT} - Esperando jugadores...`);
});