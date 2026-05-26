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
  const [sala, setSala] = useState('sala-general');

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-4 gap-6 font-sans">
      <h1 className="text-3xl font-black text-emerald-500">Chamy Chess Pro</h1>
      
      <div className="flex gap-4 w-full max-w-[500px]">
        <input className="bg-zinc-800 p-2 rounded flex-1" placeholder="Nombre de sala" onChange={(e) => setSala(e.target.value)} />
      </div>

      <div className="flex justify-between w-full max-w-[500px] font-mono text-xl">
        <div className="bg-zinc-800 px-4 py-2 rounded">Bl: {Math.floor(timerWhite/60)}:{String(timerWhite%60).padStart(2,'0')}</div>
        <div className="bg-zinc-800 px-4 py-2 rounded">Ng: {Math.floor(timerBlack/60)}:{String(timerBlack%60).padStart(2,'0')}</div>
      </div>

      <div className="w-full max-w-[500px] aspect-square bg-zinc-900 relative">
        <Chessboard position={fen} onPieceDrop={(s, t) => makeMove({ from: s, to: t, promotion: 'q' })} boardOrientation={color} />
        {status && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-4xl font-black text-emerald-500">JAQUE MATE</div>}
      </div>

      <div className="w-full max-w-[500px] h-32 bg-zinc-900 p-4 rounded overflow-y-auto text-xs font-mono border border-zinc-800">
        {history.map((m, i) => <span key={i}>{i % 2 === 0 ? `${i/2+1}. ` : ''}{m} </span>)}
      </div>
    </div>
  );
}

export default App;