import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from './engine';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'https://mati-chess-pro.onrender.com', {
  transports: ['websocket'], // Forzamos WebSocket
  reconnection: true,        // Reintentar si se cae
  reconnectionAttempts: 5
});

function App() {
  const gameRef = useRef(new Chess());
  const intervalRef = useRef(null);
  const [fen, setFen] = useState(gameRef.current.fen());
  const [history, setHistory] = useState([]);
  const [timerWhite, setTimerWhite] = useState(600);
  const [timerBlack, setTimerBlack] = useState(600);
  const [status, setStatus] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  
  const [modo, setModo] = useState('online');
  const [color, setColor] = useState('white');
  const [dificultad, setDificultad] = useState(2);
  const [sala, setSala] = useState('sala-general');

  useEffect(() => {
    if (gameStarted && !status) {
      intervalRef.current = setInterval(() => {
        if (gameRef.current.turn() === 'w') setTimerWhite(t => t > 0 ? t - 1 : 0);
        else setTimerBlack(t => t > 0 ? t - 1 : 0);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [gameStarted, status]);

  useEffect(() => {
    if (modo !== 'ia' || status) return;
    const iaTurn = color === 'white' ? 'b' : 'w';
    if (gameRef.current.turn() === iaTurn) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(gameRef.current, dificultad);
        if (bestMove) makeMove(bestMove);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [fen, modo, color, dificultad, status]);

  function makeMove(move) {
    try {
      const result = gameRef.current.move(move);
      if (result) {
        if (!gameStarted) setGameStarted(true);
        setFen(gameRef.current.fen());
        setHistory(gameRef.current.history());
        if (gameRef.current.isGameOver()) setStatus('mate');
        if (modo === 'online') socket.emit('mover_pieza', { idSala: sala, nuevoTablero: gameRef.current.fen() });
        return true;
      }
    } catch (e) { return false; }
  }

  function handleUndo() {
    gameRef.current.undo();
    if (modo === 'ia') gameRef.current.undo();
    setFen(gameRef.current.fen());
    setHistory(gameRef.current.history());
    setStatus(null);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row p-2 md:p-6 gap-4 md:gap-6 justify-center font-sans">
      
      {/* PANEL IZQUIERDO */}
      <div className="w-full md:w-[300px] bg-zinc-900 p-4 rounded-2xl flex flex-col gap-3 border border-zinc-800">
        <h1 className="text-xl font-black text-emerald-500">Chamy Chess Pro</h1>
        <input className="bg-zinc-800 p-2 rounded text-sm" placeholder="Sala" onChange={(e) => setSala(e.target.value)} />
        <select className="bg-zinc-800 p-2 rounded text-sm" onChange={(e) => setModo(e.target.value)}>
          <option value="online">Online</option>
          <option value="ia">Contra IA</option>
        </select>
        <select className="bg-zinc-800 p-2 rounded text-sm" value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="white">Color: Blancas</option>
          <option value="black">Color: Negras</option>
        </select>
        {modo === 'ia' && (
          <select className="bg-zinc-800 p-2 rounded text-sm" value={dificultad} onChange={(e) => setDificultad(Number(e.target.value))}>
            <option value={1}>Principiante</option>
            <option value={2}>Intermedio</option>
            <option value={3}>Experto</option>
          </select>
        )}
        <button className="bg-zinc-700 p-2 rounded text-sm" onClick={handleUndo}>Deshacer</button>
        <button className="bg-red-600 p-2 rounded text-sm" onClick={() => window.location.reload()}>Reiniciar</button>
        
        <div className="font-mono text-sm border-t border-zinc-700 pt-2 mt-2">
           <div>Bl: {Math.floor(timerWhite/60)}:{String(timerWhite%60).padStart(2,'0')} | Ng: {Math.floor(timerBlack/60)}:{String(timerBlack%60).padStart(2,'0')}</div>
        </div>
      </div>

      {/* TABLERO */}
      <div className="w-full max-w-[500px] aspect-square bg-zinc-900 border-4 border-zinc-800 rounded-lg relative self-center">
        <Chessboard position={fen} onPieceDrop={(s,t) => makeMove({from: s, to: t, promotion: 'q'})} boardOrientation={color} />
        {status && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 text-center p-4">
                <h2 className="text-2xl font-black text-emerald-500">JAQUE MATE!</h2>
                <button className="mt-4 bg-emerald-600 px-6 py-2 rounded-full font-bold" onClick={() => window.location.reload()}>Jugar de nuevo</button>
            </div>
        )}
      </div>

      {/* HISTORIAL */}
      <div className="w-full md:w-[200px] h-[150px] md:h-auto bg-zinc-900 p-4 rounded-2xl font-mono text-xs overflow-y-auto border border-zinc-800">
        <h3 className="font-bold mb-2 border-b border-zinc-700 pb-1">Historial</h3>
        {history.map((m, i) => <span key={i}>{i%2===0 ? `${i/2+1}. ` : ''}{m} </span>)}
      </div>
    </div>
  );
}

export default App;