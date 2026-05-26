import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from './engine';
import io from 'socket.io-client';

// Asegurate de que esta IP sea la 192.168.1.42 de tu PC
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

function App() {
  const [game, setGame] = useState(new Chess());
  const [modo, setModo] = useState('online');
  const [color, setColor] = useState('white');
  const [dificultad, setDificultad] = useState(2);
  const [sala, setSala] = useState('sala1');

  useEffect(() => {
    socket.emit('unirse_partida', { idSala: sala });
    socket.on('tablero_actualizado', (fen) => setGame(new Chess(fen)));
    return () => socket.off('tablero_actualizado');
  }, [sala]);

  function makeMove(move) {
    const gameCopy = new Chess(game.fen());
    const result = gameCopy.move(move);
    if (result) {
      setGame(gameCopy);
      if (modo === 'online') socket.emit('mover_pieza', { idSala: sala, nuevoTablero: gameCopy.fen() });
      return true;
    }
    return false;
  }

  function onDrop(source, target) {
    if (game.isGameOver()) return false;
    if (modo === 'online' && game.turn() !== (color === 'white' ? 'w' : 'b')) return false;
    return makeMove({ from: source, to: target, promotion: 'q' });
  }

  useEffect(() => {
    if (modo === 'ia' && game.turn() !== (color === 'white' ? 'w' : 'b') && !game.isGameOver()) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(game, dificultad);
        if (bestMove) makeMove(bestMove);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [game.fen(), modo, color, dificultad]);

  function handleUndo() {
    const gameCopy = new Chess(game.fen());
    gameCopy.undo();
    if (modo === 'ia') gameCopy.undo();
    setGame(gameCopy);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row justify-center items-center p-4 md:p-8 gap-8 font-sans">
      
      {/* PANEL DE OPCIONES - A LA IZQUIERDA */}
      <div className="w-full max-w-[400px] bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-6">
        <h1 className="text-3xl font-black text-emerald-500">Mati Chess PRO</h1>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Modo de Juego</label>
            <select className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1" onChange={(e) => setModo(e.target.value)}>
              <option value="online">Modo Online</option>
              <option value="ia">Contra IA</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Color de Fichas</label>
            <select className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1" value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="white">Blancas</option>
              <option value="black">Negras</option>
            </select>
          </div>
        </div>

        {modo === 'ia' && (
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Dificultad (IA)</label>
            <select className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1" value={dificultad} onChange={(e) => setDificultad(Number(e.target.value))}>
              <option value={1}>Principiante</option>
              <option value={2}>Intermedio</option>
              <option value={3}>Experto</option>
              <option value={4}>ULTRA DIFICIL</option>
            </select>
          </div>
        )}

        <div className="flex gap-4">
          <button className="flex-1 bg-zinc-700 hover:bg-zinc-600 p-3 rounded font-bold" onClick={handleUndo}>Deshacer</button>
          <button className="flex-1 bg-red-600 hover:bg-red-500 p-3 rounded font-bold" onClick={() => setGame(new Chess())}>Reiniciar</button>
        </div>
      </div>

      {/* TABLERO - A LA DERECHA */}
      <div className="w-full max-w-[500px] aspect-square border-4 border-zinc-800 rounded-lg shadow-2xl bg-zinc-900">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop} 
          boardOrientation={color} 
        />
      </div>
      
    </div>
  );
}

export default App;
