import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from './engine';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

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

  // Lógica del reloj
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

  // IA Logic
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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-row p-6 gap-6 justify-center font-sans">
      {/* PANEL IZQUIERDO */}
      <div className="w-[300px] bg-zinc-900 p-6 rounded-2xl flex flex-col gap-4 border border-zinc-800">
        <h1 className="text-2xl font-black text-emerald-500">Chamy Chess Pro</h1>
        <input className="bg-zinc-800 p-2 rounded border border-zinc-700" placeholder="Nombre de sala" onChange={(e) => setSala(e.target.value)} />
        <select className="bg-zinc-800 p-2 rounded border border-zinc-700" onChange={(e) => setModo(e.target.value)}>
          <option value="online">Modo: Online</option>
          <option value="ia">Modo: Contra IA</option>
        </select>
        <select className="bg-zinc-800 p-2 rounded border border-zinc-700" value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="white">Color: Blancas</option>
          <option value="black">Color: Negras</option>
        </select>
        {modo === 'ia' && (
          <select className="bg-zinc-800 p-2 rounded border border-zinc-700" value={dificultad} onChange={(e) => setDificultad(Number(e.target.value))}>
            <option value={1}>Dificultad: Principiante</option>
            <option value={2}>Dificultad: Intermedio</option>
            <option value={3}>Dificultad: Experto</option>
          </select>
        )}
        <button className="bg-zinc-700 p-2 rounded hover:bg-zinc-600 transition" onClick={handleUndo}>Deshacer Movimiento</button>
        <button className="bg-red-600 p-2 rounded hover:bg-red-500 transition" onClick={() => window.location.reload()}>Reiniciar</button>
        
        <div className="mt-auto bg-zinc-950 p-4 rounded font-mono border border-zinc-800">
          <div className="text-zinc-500 text-[10px] mb-1">RELOJ DE PARTIDA</div>
          <div className="flex justify-between text-xl">
             <span>Bl: {Math.floor(timerWhite/60)}:{String(timerWhite%60).padStart(2,'0')}</span>
             <span>Ng: {Math.floor(timerBlack/60)}:{String(timerBlack%60).padStart(2,'0')}</span>
          </div>
        </div>
      </div>

      {/* TABLERO CENTRAL */}
      <div className="w-[500px] aspect-square bg-zinc-900 border-4 border-zinc-800 rounded-lg relative">
        <Chessboard position={fen} onPieceDrop={(s,t) => makeMove({from: s, to: t, promotion: 'q'})} boardOrientation={color} />
        {status && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                <h2 className="text-4xl font-black text-emerald-500">JAQUE MATE!</h2>
                <button className="mt-4 bg-emerald-600 px-6 py-2 rounded-full font-bold" onClick={() => window.location.reload()}>Jugar de nuevo</button>
            </div>
        )}
      </div>

      {/* HISTORIAL DERECHA */}
      <div className="w-[200px] bg-zinc-900 p-4 rounded-2xl font-mono text-sm overflow-y-auto border border-zinc-800">
        <h3 className="font-bold mb-2 border-b border-zinc-700 pb-1">Historial</h3>
        {history.map((m, i) => <div key={i}>{i%2===0 ? `${i/2+1}. ` : ''}{m}</div>)}
      </div>
    </div>
  );
}

export default App;