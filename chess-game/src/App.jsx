import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

const socket = io('https://mati-chess-pro.onrender.com', { transports: ['websocket'] });

function App() {
  const [game, setGame] = useState(new Chess());
  const [sala, setSala] = useState('');
  const [conectado, setConectado] = useState(false);

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
    <div style={{ backgroundColor: '#2d2d2d', minHeight: '100vh', color: 'white', padding: '20px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '30px' }}>
      
      {/* TABLERO (El protagonista) */}
      <div style={{ width: '90vw', maxWidth: '500px' }}>
        <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      </div>

      {/* PANEL DE OPCIONES (Al lado) */}
      <div style={{ background: '#383838', padding: '20px', borderRadius: '10px', width: '300px', height: 'fit-content' }}>
        <h2>Mati Chess Pro</h2>
        
        {/* Aquí van tus opciones de sala */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #555', paddingBottom: '15px' }}>
          <h3>Conexión</h3>
          {!conectado ? (
            <div>
              <input type="text" placeholder="Nombre de la sala" onChange={(e) => setSala(e.target.value)} style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} />
              <button onClick={() => { socket.emit("join_sala", sala); setConectado(true); }} style={{ marginTop: '10px', width: '100%', padding: '8px' }}>Unirse a Partida</button>
            </div>
          ) : (
            <p style={{ color: '#4caf50' }}>✅ Conectado: <b>{sala}</b></p>
          )}
        </div>

        {/* AQUÍ VAN LAS OTRAS OPCIONES QUE TENÍAS ANTES */}
        <div>
          <h3>Opciones</h3>
          <button onClick={() => setGame(new Chess())} style={{ width: '100%', padding: '10px' }}>Reiniciar Tablero</button>
          {/* Pegá aquí cualquier otro botón que solías tener */}
        </div>
      </div>
      
    </div>
  );
}

export default App;