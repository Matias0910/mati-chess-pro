import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import ErrorBoundary from './ErrorBoundary'; // Importa el ErrorBoundary
import { getBestMove } from './engine.js';
import { io } from 'socket.io-client';
import './App.css';

// Detecta automáticamente si estás en local o en producción
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// Obtener la URL del socket en tiempo de ejecución.
function getSocketUrl() {
  const envUrl = import.meta.env?.VITE_SOCKET_URL;

  if (envUrl && envUrl.trim() !== "" && !envUrl.includes("example")) {
    console.log("🌐 Conectando al servidor en:", envUrl);
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.__VITE_SOCKET_URL__) return window.__VITE_SOCKET_URL__;

  console.warn("⚠️ VITE_SOCKET_URL no definida. Usando fallback local.");
  return "http://localhost:3001";
}

function getTransports(url) {
  // Intentar WebSocket primero es mucho más estable en 4G/5G
  return ['websocket', 'polling'];
}

function App() {
  const [game, setGame] = useState(() => new Chess());
  const [dificultad, setDificultad] = useState('2');
  const [status, setStatus] = useState('Blanco comienza');
  const [history, setHistory] = useState([]);

  const socketRef = useRef(null);
  const [roomId, setRoomId] = useState('');
  const [playerColor, setPlayerColor] = useState('white');
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Esperando conexión...');
  const [rematchStatus, setRematchStatus] = useState('none'); // 'none', 'sent', 'received'
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
    const socketUrl = getSocketUrl();
    socketRef.current = io(socketUrl, {
      transports: getTransports(socketUrl), // Elegir transporte según host
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Conectado a:', socketUrl, 'ID:', socketRef.current.id);
      setConnectionStatus('Conectado');
      // console.log('Current socket instance:', socketRef.current); // Para depuración avanzada
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Desconectado del servidor. Razón:', reason);
      setConnectionStatus('Desconectado (Reintentando...)');
    });
    
    socketRef.current.on('movimiento_recibido', (fen) => {
      console.log('📥 Movimiento recibido desde el oponente:', fen);
      try {
        const g = new Chess(fen);
        setGame(g);
      } catch (err) {
        console.error("Error al sincronizar el tablero:", err);
      }
    });

    socketRef.current.on('propuesta_revancha', () => {
      setRematchStatus('received');
    });

    socketRef.current.on('reiniciar_juego', () => {
      startNewGame();
      setRematchStatus('none');
    });

    // Capturar errores para saber qué está pasando realmente
    socketRef.current.on('connect_error', (err) => {
      console.error("❌ Error de conexión:", err.message);
      // Si el error es de transporte, es probable que el servidor esté arrancando en Render
      if (err.message.includes('xhr poll error') || err.message.includes('timeout')) {
        setConnectionStatus('Despertando servidor en la nube... (espera 1 min)');
      } else {
        setConnectionStatus(`Error: ${err.message}`);
      }
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

    setHistory(g.history()); // Usamos la instancia local 'g' que es más fiable
  }, [game]);

  function makeAIMove(currentGame) {
    const g = new Chess();
    g.loadPgn(currentGame.pgn());
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
    const g = new Chess();
    g.loadPgn(game.pgn());
    if (g.isGameOver()) return false;

    // CORRECCIÓN: Comparar correctamente el turno ('w'/'b') con el color elegido ('white'/'black')
    if (isOnline) {
      const currentTurn = g.turn() === 'w' ? 'white' : 'black';
      if (currentTurn !== playerColor) {
        console.warn(`🚫 No es tu turno. Eres ${playerColor} y el turno es de ${currentTurn}`);
        return false;
      }
      if (!roomId) return false; // No permitir mover si no hay una sala activa
    }

    const move = g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move === null) return false;

    setGame(g);
    const newFen = g.fen();

    if (isOnline && socketRef.current && roomId) {
      console.log('📤 Enviando movimiento a la sala:', roomId);
      socketRef.current.emit('mover_pieza', { idSala: roomId, nuevoTablero: newFen });
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

    // Creamos una copia que herede el historial completo
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    
    if (gameCopy.history().length >= 2) {
      gameCopy.undo(); // Deshace movimiento IA
      gameCopy.undo(); // Deshace movimiento Jugador
      setGame(gameCopy);
    }
  }

  function handleAcceptRematch() {
    if (isOnline && roomId && socketRef.current) {
      socketRef.current.emit('aceptar_revancha', roomId);
    }
  }

  function resetGame() {
    if (isOnline) {
      if (roomId && socketRef.current) {
        socketRef.current.emit('solicitar_revancha', roomId);
        setRematchStatus('sent');
      }
      return;
    }
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
        <button 
          className="neon-btn" 
          onClick={resetGame} 
          disabled={isOnline && rematchStatus === 'sent'}
        >
          {isOnline && rematchStatus === 'sent' ? 'Esperando...' : 'Nuevo Juego'}
        </button>
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
            {rematchStatus === 'received' && (
              <button className="neon-btn" style={{marginTop: '10px', borderColor: '#ff00d4', boxShadow: '0 0 10px #ff00d4'}} onClick={handleAcceptRematch}>
                Aceptar Revancha
              </button>
            )}
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