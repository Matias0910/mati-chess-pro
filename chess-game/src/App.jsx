import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

// Conexión al servidor en Render
const socket = io('https://mati-chess-pro.onrender.com', {
  transports: ['websocket']
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
  }, []);

  const unirseASala = () => {
    if (sala !== "") {
      socket.emit("join_sala", sala);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
      {!conectado ? (
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Nombre de la sala" 
            onChange={(e) => setSala(e.target.value)} 
          />
          <button onClick={unirseASala}>Unirse</button>
        </div>
      ) : (
        <h3>Sala: {sala}</h3>
      )}
      
      <div style={{ width: '90vw', maxWidth: '500px' }}>
        <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      </div>
    </div>
  );
}

export default App;