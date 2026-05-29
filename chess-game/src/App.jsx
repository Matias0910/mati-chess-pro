import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from './engine.js';
import { io } from 'socket.io-client';
import './App.css';

// Cambia esta URL por la que te dé Render o el servicio que uses
const SOCKET_SERVER_URL = 'https://mati-chess-pro.onrender.com'; // <--- TU URL REAL AQUÍ

function App() {
  const [game, setGame] = useState(() => new Chess());
  const [dificultad, setDificultad] = useState('2');
  const [status, setStatus] = useState('Blanco comienza');
  const [history, setHistory] = useState([]);

  const socketRef = useRef(null);
  const [roomId, setRoomId] = useState('');
  const [playerColor, setPlayerColor] = useState('white');
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on('connect', () => setConnectionStatus('Conectado'));
    socketRef.current.on('disconnect', () => setConnectionStatus('Desconectado'));
    socketRef.current.on('movimiento_recibido', (fen) => {
      const g = new Chess(fen);
      setGame(g);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const g = new Chess(game.fen());

    if (g.isCheckmate()) {
      setStatus(`Jaque mate - ${g.turn() === 'w' ? 'Negras ganan' : 'Blancas ganan'}`);
    } else if (g.isStalemate()) {
      setStatus('Tablas por ahogado');
    } else if (g.isDraw()) {
      setStatus('Tablas');
    } else if (g.inCheck()) {
      setStatus(`${g.turn() === 'w' ? 'Blancas' : 'Negras'} en jaque`);
    } else {
      setStatus(`Turno de ${g.turn() === 'w' ? 'Blancas' : 'Negras'}`);
    }

    setHistory(game.history());
  }, [game]);

  function makeAIMove(currentGame) {
    const g = new Chess(currentGame.fen());
    if (g.isGameOver()) return;

    const move = getBestMove(g, Number(dificultad));
    if (!move) return;

    g.move(move);
    setGame(g);
  }

  function startNewGame() {
    const g = new Chess();
    setGame(g);

    if (!isOnline && playerColor === 'black') {
      setTimeout(() => {
        makeAIMove(g);
      }, 100);
    }
  }

  function handleCreateRoom() {
    if (!socketRef.current) return;
    const newRoom = Math.random().toString(36).slice(2, 9);
    setRoomId(newRoom);
    socketRef.current.emit('join_sala', newRoom);
    setConnectionStatus(`Sala creada: ${newRoom}`);
  }

  function handleJoinRoom() {
    if (!socketRef.current || !roomId) return;
    socketRef.current.emit('join_sala', roomId);
    setConnectionStatus(`Unido a sala ${roomId}`);
  }

  function onDrop(sourceSquare, targetSquare) {
    const g = new Chess(game.fen());
    if (isOnline && g.turn() !== playerColor) return false;

    const move = g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move === null) return false;

    setGame(g);

    if (isOnline && socketRef.current && roomId) {
      socketRef.current.emit('mover_pieza', { idSala: roomId, nuevoTablero: g.fen() });
    } else if (!isOnline) {
      setTimeout(() => {
        if (!g.isGameOver()) {
          makeAIMove(g);
        }
      }, 400);
    }

    return true;
  }

  function retroceder() {
    if (isOnline) return;

    const g = new Chess(game.fen());
    const historyLength = g.history().length;
    if (historyLength < 2) return;

    g.undo();
    g.undo();
    setGame(g);
  }

  function resetGame() {
    if (isOnline) return;
    startNewGame();
  }

  return (
    <div className="main-container">
      <div className="top-bar">
        <select
          className="neon-btn"
          value={dificultad}
          onChange={(e) => setDificultad(e.target.value)}
        >
          <option value="1">Fácil</option>
          <option value="2">Medio</option>
          <option value="4">Difícil</option>
        </select>

        <select
          className="neon-btn"
          value={playerColor}
          onChange={(e) => setPlayerColor(e.target.value)}
        >
          <option value="white">Blancas</option>
          <option value="black">Negras</option>
        </select>

        <select
          className="neon-btn"
          value={isOnline ? 'online' : 'local'}
          onChange={(e) => setIsOnline(e.target.value === 'online')}
        >
          <option value="local">Local</option>
          <option value="online">Online</option>
        </select>

        <button className="neon-btn" onClick={retroceder} disabled={isOnline}>Retroceder</button>
        <button className="neon-btn" onClick={resetGame} disabled={isOnline}>Nuevo Juego</button>
      </div>

      {isOnline && (
        <div className="online-panel">
          <div className="room-row">
            <input
              className="room-input"
              value={roomId}
              placeholder="ID de sala"
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button className="neon-btn" onClick={handleCreateRoom}>Crear sala</button>
            <button className="neon-btn" onClick={handleJoinRoom}>Unirse</button>
          </div>
          <p className="connection-status">{connectionStatus}</p>
          <p className="connection-status">{`Color: ${playerColor === 'white' ? 'Blancas' : 'Negras'}`}</p>
        </div>
      )}

      <div className="game-wrapper">
        <div className="side-panel">
          <h3>Mati Chess Pro</h3>
          <p className="status">{status}</p>

          <div className="history">
            <h4>Historial</h4>
            <ul className="history-list">
              {history.map((move, index) => (
                <li key={`${move}-${index}`}>{index + 1}. {move}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="board-container">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardWidth={480}
            boardOrientation={playerColor}
          />
        </div>
      </div>
    </div>
  );
}

export default App;