import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from './engine';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

function App() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [history, setHistory] = useState([]);
  const [timerWhite, setTimerWhite] = useState(600);
  const [timerBlack, setTimerBlack] = useState(600);
  const [status, setStatus] = useState(null);
  
  const [modo, setModo] = useState('online');
  const [color, setColor] = useState('white');
  const [dificultad, setDificultad] = useState(2);
  const [sala, setSala] = useState('sala-general');
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
  }, []);

  useEffect(() => {
    socket.emit('unirse_partida', { idSala: sala });
    socket.on('tablero_actualizado', (newFen) => {
      gameRef.current.load(newFen);
      setFen(newFen);
      setHistory(gameRef.current.history());
    });
    return () => socket.off('tablero_actualizado');
  }, [sala]);

  useEffect(() => {
    if (status) return;
    const interval = setInterval(() => {
      if (gameRef.current.turn() === 'w') setTimerWhite(t => t > 0 ? t - 1 : 0);
      else setTimerBlack(t => t > 0 ? t - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [fen, status]);

  function makeMove(move) {
    try {
      const result = gameRef.current.move(move);
      if (result) {
        setFen(gameRef.current.fen());
        setHistory(gameRef.current.history());
        if (gameRef.current.isGameOver()) setStatus('mate');
        if (modo === 'online') socket.emit('mover_pieza', { idSala: sala, nuevoTablero: gameRef.current.fen() });
        return true;
      }
    } catch (e) { return false; }
  }

  function onDrop(source, target) {
    if (status) return false;
    if (modo === 'online' && gameRef.current.turn() !== (color === 'white' ? 'w' : 'b')) return false;
    return makeMove({ from: source, to: target, promotion: 'q' });
  }

  useEffect(() => {
    if (modo === 'ia' && gameRef.current.turn() !== (color === 'white' ? 'w' : 'b') && !status) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(gameRef.current, dificultad);
        if (bestMove) makeMove(bestMove);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fen, modo, color, dificultad, status]);

  function handleUndo() {
    if (status) return;
    if (modo === 'ia') { gameRef.current.undo(); gameRef.current.undo(); }
    else { gameRef.current.undo(); }
    setFen(gameRef.current.fen());
    setHistory(gameRef.current.history());
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-4 gap-6 font-sans">
      <h1 className="text-3xl font-black text-emerald-500">Chamy Chess Pro</h1>
      
      <div className={`text-[10px] font-bold ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
        {isConnected ? '● SERVIDOR ONLINE' : '○ CONECTANDO...'}
      </div>

      <div className="flex gap-4 w-full max-w-[500px]">
        <input className="bg-zinc-800 p-2 rounded flex-1" placeholder="Sala" onChange={(e) => setSala(e.target.value)} />
        <select className="bg-zinc-800 p-2 rounded" onChange={(e) => setModo(e.target.value)}>
          <option value="online">Online</option>
          <option value="ia">Contra IA</option>
        </select>
      </div>

      <div className="flex justify-between w-full max-w-[500px] font-mono text-xl">
        <div className="bg-zinc-800 px-4 py-2 rounded">Bl: {Math.floor(timerWhite/60)}:{String(timerWhite%60).padStart(2,'0')}</div>
        <div className="bg-zinc-800 px-4 py-2 rounded">Ng: {Math.floor(timerBlack/60)}:{String(timerBlack%60).padStart(2,'0')}</div>
      </div>

      <div className="w-full max-w-[500px] aspect-square bg-zinc-900 relative">
        <Chessboard position={fen} onPieceDrop={onDrop} boardOrientation={color} />
        {status && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-4xl font-black text-emerald-500 z-10">JAQUE MATE</div>}
      </div>

      <div className="flex gap-4 w-full max-w-[500px]">
        <button className="flex-1 bg-zinc-700 p-2 rounded" onClick={handleUndo}>Deshacer</button>
        <button className="flex-1 bg-red-600 p-2 rounded" onClick={() => { gameRef.current = new Chess(); setFen(gameRef.current.fen()); }}>Reiniciar</button>
      </div>

      <div className="w-full max-w-[500px] h-20 bg-zinc-900 p-4 rounded overflow-y-auto text-xs font-mono border border-zinc-800">
        {history.map((m, i) => <span key={i}>{i % 2 === 0 ? `${i/2+1}. ` : ''}{m} </span>)}
      </div>
    </div>
  );
}

export default App;