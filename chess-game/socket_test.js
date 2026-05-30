const { io } = require('socket.io-client');
const urls = ['http://localhost:3001', 'https://mati-chess-backend-3001.loca.lt'];
urls.forEach((url) => {
  const socket = io(url, { transports: ['polling', 'websocket'], reconnectionAttempts: 2, timeout: 5000 });
  socket.on('connect', () => { console.log(url, 'connected', socket.id); socket.disconnect(); });
  socket.on('connect_error', (err) => { console.log(url, 'connect_error', err.message); socket.disconnect(); });
  socket.on('error', (err) => { console.log(url, 'error', err && err.message); socket.disconnect(); });
});
setTimeout(() => process.exit(0), 10000);
