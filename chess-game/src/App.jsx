import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from './engine';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

function App() {
  const gameRef = useRef(new Chess());
  const [board, setBoard] = useState(gameRef.current.board());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  const [modo, setModo] = useState('online');
  const [color, setColor] = useState('white');
  const [dificultad, setDificultad] = useState(2);
  const [sala, setSala] = useState('sala1');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  useEffect(() => {
    if (gameRef.current.isGameOver()) {
      if (gameRef.current.isCheckmate()) setStatus('mate');
      else if (gameRef.current.isDraw()) setStatus('empate');
    } else {
      setStatus(null);
    }
  }, [fen]);

  useEffect(() => {
    socket.emit('unirse_partida', { idSala: sala });
    socket.on('tablero_actualizado', (newFen) => {
      gameRef.current.load(newFen);
      setFen(newFen);
      setBoard(gameRef.current.board());
    });
    return () => socket.off('tablero_actualizado');
  }, [sala]);

  function makeMove(move) {
    try {
      const result = gameRef.current.move(move);
      if (result) {
        setFen(gameRef.current.fen());
        setBoard(gameRef.current.board());
        if (modo === 'online') socket.emit('mover_pieza', { idSala: sala, nuevoTablero: gameRef.current.fen() });
        return true;
      }
    } catch (e) { console.log('Movimiento inválido'); }
    return false;
  }

  function onDrop(source, target) {
    if (gameRef.current.isGameOver()) return false;
    const turn = gameRef.current.turn();
    const playerColor = color === 'white' ? 'w' : 'b';
    if ((modo === 'online' || modo === 'ia') && turn !== playerColor) return false;
    return makeMove({ from: source, to: target, promotion: 'q' });
  }

  useEffect(() => {
    if (modo === 'ia' && gameRef.current.turn() !== (color === 'white' ? 'w' : 'b') && !gameRef.current.isGameOver()) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(gameRef.current, dificultad);
        if (bestMove) makeMove(bestMove);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fen, modo, color, dificultad]);

  function handleUndo() {
    if (status) return;
    if (modo === 'ia') { gameRef.current.undo(); gameRef.current.undo(); }
    else { gameRef.current.undo(); }
    setFen(gameRef.current.fen());
    setBoard(gameRef.current.board());
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row justify-center items-center p-4 md:p-8 gap-8 font-sans">
      <div className="w-full max-w-[400px] bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-6">
        <h1 className="text-3xl font-black text-emerald-500">Chamy Chess Pro</h1>
        
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          {isConnected ? 'SERVIDOR ONLINE' : 'CONECTANDO...'}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Modo</label>
            <select className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1" value={modo} onChange={(e) => setModo(e.target.value)}>
              <option value="online">Online</option>
              <option value="ia">Contra IA</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Color</label>
            <select className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1" value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="white">Blancas</option>
              <option value="black">Negras</option>
            </select>
          </div>
        </div>

        {modo === 'ia' && (
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Dificultad</label>
            <select className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1" value={dificultad} onChange={(e) => setDificultad(Number(e.target.value))}>
              <option value={1}>Principiante</option>
              <option value={2}>Intermedio</option>
              <option value={3}>Experto</option>
              <option value={4}>ULTRA DIFICIL</option>
            </select>
          </div>
        )}

        <div className="flex gap-4">
          <button className={`flex-1 ${status ? 'bg-zinc-800' : 'bg-zinc-700 hover:bg-zinc-600'} p-3 rounded font-bold transition`} onClick={handleUndo} disabled={!!status}>Deshacer</button>
          <button className="flex-1 bg-red-600 hover:bg-red-500 p-3 rounded font-bold" onClick={() => { gameRef.current = new Chess(); setFen(gameRef.current.fen()); setBoard(gameRef.current.board()); }}>Reiniciar</button>
        </div>
      </div>

      <div className="w-full max-w-[500px] aspect-square border-4 border-zinc-800 rounded-lg shadow-2xl bg-zinc-900 relative">
        <Chessboard position={fen} onPieceDrop={onDrop} boardOrientation={color} />
        {status && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex flex-col justify-center items-center gap-6 z-10">
            {status === 'mate' && (<><span className="text-8xl">👑</span><h2 className="text-5xl font-black text-emerald-500">JAQUE MATE</h2></>)}
            {status === 'empate' && (<><span className="text-8xl">🤝</span><h2 className="text-5xl font-black text-zinc-100">EMPATE</h2></>)}
            <button className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-full font-bold text-lg mt-4" onClick={() => { gameRef.current = new Chess(); setFen(gameRef.current.fen()); setBoard(gameRef.current.board()); }}>Jugar de nuevo</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;