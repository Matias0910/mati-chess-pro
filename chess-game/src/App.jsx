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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-row p-6 gap-6 justify-center">
      {/* PANEL IZQUIERDO */}
      <div className="w-[300px] bg-zinc-900 p-6 rounded-2xl flex flex-col gap-4">
        <h1 className="text-2xl font-black text-emerald-500">Chamy Chess Pro</h1>
        <div className={`text-xs ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>● SERVIDOR ONLINE</div>
        <input className="bg-zinc-800 p-2 rounded" placeholder="Sala" onChange={(e) => setSala(e.target.value)} />
        <select className="bg-zinc-800 p-2 rounded" onChange={(e) => setModo(e.target.value)}>
          <option value="online">Online</option>
          <option value="ia">Contra IA</option>
        </select>
        <button className="bg-zinc-700 p-2 rounded" onClick={() => { gameRef.current.undo(); if(modo==='ia') gameRef.current.undo(); setFen(gameRef.current.fen()); }}>Deshacer</button>
        <button className="bg-red-600 p-2 rounded" onClick={() => { gameRef.current = new Chess(); setFen(gameRef.current.fen()); setStatus(null); }}>Reiniciar</button>
        <div className="mt-auto font-mono">
            <div>Blanco: {Math.floor(timerWhite/60)}:{String(timerWhite%60).padStart(2,'0')}</div>
            <div>Negro: {Math.floor(timerBlack/60)}:{String(timerBlack%60).padStart(2,'0')}</div>
        </div>
      </div>

      {/* TABLERO CENTRAL */}
      <div className="w-[500px] aspect-square bg-zinc-900 relative">
        <Chessboard position={fen} onPieceDrop={(s,t) => makeMove({from: s, to: t, promotion: 'q'})} boardOrientation={color} />
        {status && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
            <h2 className="text-4xl font-black text-emerald-500">JAQUE MATE!</h2>
            <button className="mt-4 bg-emerald-600 px-6 py-2 rounded-full" onClick={() => window.location.reload()}>Jugar de nuevo</button>
        </div>}
      </div>

      {/* HISTORIAL DERECHA */}
      <div className="w-[200px] bg-zinc-900 p-4 rounded-2xl font-mono text-sm overflow-y-auto">
        <h3 className="font-bold mb-2">Historial</h3>
        {history.map((m, i) => <div key={i}>{i%2===0 ? `${i/2+1}. ` : ''}{m}</div>)}
      </div>
    </div>
  );
}

export default App;