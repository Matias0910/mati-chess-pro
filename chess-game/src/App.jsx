import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

const socket = io('https://mati-chess-pro.onrender.com', { transports: ['websocket'] });

function App() {
  const [game, setGame] = useState(new Chess());
  const [sala, setSala] = useState('');
  const [conectado, setConectado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    socket.on('movimiento_recibido', (fen) => {
      setGame(new Chess(fen));
    });
  }, []);

  function onDrop(sourceSquare, targetSquare) {
    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({ from: sourceSquare, to: targetSquare });
    if (move === null) return false;
    
    setGame(gameCopy);
    if (conectado) {
      socket.emit('mover_pieza', { idSala: sala, nuevoTablero: gameCopy.fen() });
    }
    return true;
  }

  return (
    <div style={{ backgroundColor: '#2d2d2d', minHeight: '100vh', color: 'white', padding: '10px' }}>
      {/* Botón de Opciones siempre visible */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2>Mati Chess Pro</h2>
        <button onClick={() => setMenuAbierto(!menuAbierto)}>⚙️ Opciones</button>
      </div>

      {/* Menú de Opciones (se despliega sobre el tablero) */}
      {menuAbierto && (
        <div style={{ background: '#444', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
          <h3>Configurar Partida</h3>
          {!conectado ? (
            <div>
              <input type="text" placeholder="Nombre de la sala" onChange={(e) => setSala(e.target.value)} />
              <button onClick={() => { socket.emit("join_sala", sala); setConectado(true); }}>Unirse</button>
            </div>
          ) : (
            <p>✅ Conectado a: <b>{sala}</b></p>
          )}
        </div>
      )}

      {/* Tablero siempre visible */}
      <div style={{ width: '90vw', maxWidth: '500px', margin: 'auto' }}>
        <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      </div>
    </div>
  );
}

export default App;