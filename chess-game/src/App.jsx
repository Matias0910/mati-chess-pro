import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';

const socket = io('https://mati-chess-pro.onrender.com', { transports: ['websocket'] });

function App() {
  const [game, setGame] = useState(new Chess());
  const [sala, setSala] = useState('');
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    socket.on('movimiento_recibido', (fen) => setGame(new Chess(fen)));
  }, []);

  function onDrop(s, t) {
    const g = new Chess(game.fen());
    if (g.move({ from: s, to: t })) {
      setGame(g);
      if (conectado) socket.emit('mover_pieza', { idSala: sala, nuevoTablero: g.fen() });
      return true;
    }
    return false;
  }

  return (
    <div className="main-container">
      <div className="top-bar">
        <button className="neon-btn">Opciones</button>
        <button className="neon-btn" onClick={() => setGame(new Chess())}>Nuevo Juego</button>
        <button className="neon-btn">Cambiar Tablero</button>
        <button className="neon-btn">Intercambiar Colores</button>
        <button className="neon-btn">Historial</button>
      </div>

      <div className="game-wrapper">
        <div className="side-panel">
          <h3>Mati Chess Pro</h3>
          <p>Conexión</p>
          <input type="text" placeholder="Nombre de la sala" onChange={(e) => setSala(e.target.value)} />
          <button onClick={() => { socket.emit("join_sala", sala); setConectado(true); }}>Unirse a Partida</button>
          <button onClick={() => setGame(new Chess())}>Reiniciar Tablero</button>
          {conectado && <p className="status">✅ Conectado: {sala}</p>}
        </div>

        <div className="board-container">
          <Chessboard position={game.fen()} onPieceDrop={onDrop} />
        </div>
      </div>
    </div>
  );
}

export default App;