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
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* Barra de Botones Superior */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button style={btnStyle}>Opciones</button>
        <button style={btnStyle} onClick={() => setGame(new Chess())}>Nuevo Juego</button>
        <button style={btnStyle}>Cambiar Tablero</button>
        <button style={btnStyle}>Intercambiar Colores</button>
        <button style={btnStyle}>Historial</button>
      </div>

      {/* Contenedor Principal */}
      <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Tablero */}
        <div style={{ width: '90vw', maxWidth: '500px' }}>
          <Chessboard position={game.fen()} onPieceDrop={onDrop} />
        </div>

        {/* Panel de Sala */}
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '10px', width: '280px', border: '1px solid #444' }}>
          <h2 style={{ marginTop: 0 }}>Mati Chess Pro</h2>
          <div style={{ marginBottom: '15px' }}>
            {!conectado ? (
              <div>
                <input type="text" placeholder="Nombre de la sala" onChange={(e) => setSala(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', color: 'white', border: 'none' }} />
                <button onClick={() => { socket.emit("join_sala", sala); setConectado(true); }} style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>Unirse a Partida</button>
              </div>
            ) : (
              <p style={{ color: '#00e676' }}>✅ Conectado a: <b>{sala}</b></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const btnStyle = { padding: '10px 15px', cursor: 'pointer', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '5px' };

export default App;