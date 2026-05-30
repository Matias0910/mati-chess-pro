const io = require('socket.io-client');

const SOCKET_URL = process.env.SOCKET_URL || 'https://mati-chess-backend-3001.loca.lt';
const ROOM = 'e2e-room-' + Date.now();

console.log('Connecting to', SOCKET_URL, 'room:', ROOM);

const opts = { reconnectionAttempts: 3, timeout: 5000 };

const a = io(SOCKET_URL, opts);
const b = io(SOCKET_URL, opts);

let received = false;

a.on('connect', () => {
  console.log('A connected, id=', a.id);
  a.emit('join_sala', ROOM);
});

b.on('connect', () => {
  console.log('B connected, id=', b.id);
  b.emit('join_sala', ROOM);
});

b.on('mover_pieza', (move) => {
  console.log('B received mover_pieza:', move);
  received = true;
  cleanup(0);
});

a.on('connect_error', (err) => {
  console.error('A connect_error', err.message);
});
b.on('connect_error', (err) => {
  console.error('B connect_error', err.message);
});

a.on('connect', () => {
  // give B a moment to join
  setTimeout(() => {
    const move = { from: 'e2', to: 'e4', room: ROOM };
    console.log('A emitting mover_pieza', move);
    a.emit('mover_pieza', move);
  }, 800);
});

function cleanup(code=0){
  try{ a.disconnect(); b.disconnect(); }catch(e){}
  process.exit(code);
}

// safety timeout
setTimeout(() => {
  if(!received){
    console.error('Test timed out without receiving move.');
    cleanup(2);
  }
}, 10000);
