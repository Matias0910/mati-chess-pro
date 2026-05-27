import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';

function App() {
  const [game, setGame] = useState(new Chess());
  const [dificultad, setDificultad] = useState('Facil');

  // Lógica para jugar contra la máquina
  function hacerMovimientoMaquina() {
    const g = new Chess(game.fen());
    const posiblesMovimientos = g.moves();
    if (posiblesMovimientos.length === 0) return;
    
    // Movimiento aleatorio (puedes mejorar esto con una IA real después)
    const randomMove = posiblesMovimientos[Math.floor(Math.random() * posiblesMovimientos.length)];
    g.move(randomMove);
    setGame(g);
  }

  function onDrop(s, t) {
    const g = new Chess(game.fen());
    try {
      const move = g.move({ from: s, to: t, promotion: 'q' });
      if (move === null) return false;
      setGame(g);
      
      // La máquina responde después de un pequeño delay
      setTimeout(hacerMovimientoMaquina, 500);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Función para retroceder
  function retroceder() {
    const g = new Chess(game.fen());
    g.undo(); // Deshace la última jugada de la máquina
    g.undo(); // Deshace tu última jugada
    setGame(g);
  }

  return (
    <div className="main-container">
      <div className="top-bar">
        <select onChange={(e) => setDificultad(e.target.value)} className="neon-btn">
          <option>Facil</option>
          <option>Medio</option>
          <option>Dificil</option>
        </select>
        <button className="neon-btn" onClick={retroceder}>Retroceder</button>
        <button className="neon-btn" onClick={() => setGame(new Chess())}>Nuevo Juego</button>
      </div>

      <div className="game-wrapper">
        <div className="side-panel">
          <h3>Mati Chess Pro</h3>
          <p>Dificultad: {dificultad}</p>
        </div>

        <div className="board-container">
          <Chessboard position={game.fen()} onPieceDrop={onDrop} />
        </div>
      </div>
    </div>
  );
}

export default App;