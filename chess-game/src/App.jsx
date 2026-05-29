import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import ErrorBoundary from './ErrorBoundary'; // Importa el ErrorBoundary
import { getBestMove } from './engine.js';
import { io } from 'socket.io-client';
import './App.css';

// Detecta automáticamente si estás en local o en producción
const SOCKET_SERVER_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://mati-chess-pro.onrender.com";

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
  const [boardWidth, setBoardWidth] = useState(window.innerWidth > 600 ? 480 : window.innerWidth - 40);

  useEffect(() => {
    const handleResize = () => {
      // Si es pantalla grande 480px, si es móvil el ancho de la pantalla menos margen
      setBoardWidth(window.innerWidth > 600 ? 480 : window.innerWidth - 40);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Añadimos transports para evitar problemas de polling en algunos navegadores/hostings
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['polling', 'websocket'], // Permitimos polling primero para mayor compatibilidad
      reconnection: true,
      reconnectionAttempts: 5,
      pingInterval: 20000, // El cliente envía un ping cada 20 segundos
      pingTimeout: 30000   // El cliente espera 30 segundos por un pong
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Conectado al servidor con ID:', socketRef.current.id);
      setConnectionStatus('Conectado');
      // console.log('Current socket instance:', socketRef.current); // Para depuración avanzada
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Desconectado del servidor. Razón:', reason);
      setConnectionStatus('Desconectado (Reintentando...)');
    });
    
    socketRef.current.on('movimiento_recibido', (fen) => {
      console.log('📥 Movimiento recibido desde el oponente:', fen);
      const g = new Chess(fen);
      setGame(g);
    });

    // Capturar errores para saber qué está pasando realmente
    socketRef.current.on('connect_error', (err) => {
      setConnectionStatus(`Error: ${err.message}`);
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
    console.log('🏠 Sala creada y emitida:', newRoom);
    setConnectionStatus(`Sala creada: ${newRoom}`);
  }

  function handleJoinRoom() {
    if (!socketRef.current || !roomId) return;
    socketRef.current.emit('join_sala', roomId);
    console.log('🔌 Intento de unión a sala:', roomId);
    setConnectionStatus(`Unido a sala ${roomId}`);
  }

  function handleCopyRoomId() {
    navigator.clipboard.writeText(roomId);
    alert("ID de sala copiado!");
  }

  function onDrop(sourceSquare, targetSquare) {
    const g = new Chess(game.fen());
    if (isOnline && g.turn() !== playerColor) return false;

    const move = g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move === null) return false;

    setGame(g);

    if (isOnline && socketRef.current && roomId) {
      console.log('📤 Enviando movimiento a la sala:', roomId);
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
    // Envuelve tu aplicación con el ErrorBoundary
    <ErrorBoundary>
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
            <button className="neon-btn" onClick={handleCreateRoom}>Crear</button>
            <button className="neon-btn" onClick={handleJoinRoom}>Unir</button>
          </div>
          <div className="connection-status">
            <p>{connectionStatus} {roomId && <span onClick={handleCopyRoomId} style={{cursor: 'pointer', textDecoration: 'underline'}}> (Copiar ID)</span>}</p>
            <p>{`Color: ${playerColor === 'white' ? 'Blancas' : 'Negras'}`}</p>
          </div>
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
            boardWidth={boardWidth}
            boardOrientation={playerColor}
          />
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App;