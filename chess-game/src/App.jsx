import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

// Conexión al servidor en Render
const socket = io('https://mati-chess-pro.onrender.com', {
  transports: ['websocket'],
});

function App() {
  const [game, setGame] = useState(new Chess());
  const [sala, setSala] = useState('');
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    // Escuchar movimientos recibidos de otros celulares
    socket.on('movimiento_recibido', (fen) => {
      const newGame = new Chess(fen);
      setGame(newGame);
    });

    return () => {
      socket.off('movimiento_recibido');
    };
  }, []);

  const unirseASala = () => {
    if (sala !== '') {
      socket.emit('join_sala', sala);
      setConectado(true);
    }
  };

  function onDrop(sourceSquare, targetSquare) {
    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({ from: sourceSquare, to: targetSquare });
      if (move === null) return false;

      setGame(gameCopy);
      // Enviar movimiento al servidor
      socket.emit('mover_pieza', { idSala: sala, nuevoTablero: gameCopy.fen() });
      return true;
    } catch (e) {
      return false;
    }
  }

  // Estilo CSS para asegurar que el tablero no se vea blanco
  const boardContainerStyle = {
    width: '90vw',
    maxWidth: '500px',
    aspectRatio: '1 / 1', // Fuerza que sea cuadrado
    margin: '0 auto', // Centra horizontalmente
    display: 'block', // Asegura que se dibuje
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <header style={{ width: '100%', padding: '20px', borderBottom: '1px solid #ddd', backgroundColor: '#fff', textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>
          {conectado ? `Sala: ${sala}` : 'Únete a una Sala'}
        </h1>
      </header>

      {!conectado ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder="Nombre de la sala"
            value={sala}
            onChange={(e) => setSala(e.target.value)}
            style={{ padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '5px' }}
          />
          <button
            onClick={unirseASala}
            style={{ padding: '10px 20px', fontSize: '1rem', color: '#fff', backgroundColor: '#007bff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Unirse
          </button>
        </div>
      ) : (
        <div style={boardContainerStyle}>
          <Chessboard position={game.fen()} onPieceDrop={onDrop} />
        </div>
      )}
    </div>
  );
}

export default App;