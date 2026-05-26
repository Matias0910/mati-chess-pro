export function getBestMove(game, dificultad) {
  const moves = game.moves();
  if (moves.length === 0) return null;

  const totalPieces = game.board().flat().filter(p => p !== null).length;
  // Profundidad dinámica: más profundo si hay pocas piezas
  let depth = dificultad === 4 ? (totalPieces < 10 ? 4 : 3) : 2;
  if (dificultad === 1) return moves[Math.floor(Math.random() * moves.length)];

  return minimaxRoot(game, depth, game.turn() === 'w');
}

function minimaxRoot(game, depth, isMaximizing) {
  const moves = game.moves();
  let bestValue = isMaximizing ? -Infinity : Infinity;
  let bestMove = null;

  for (const move of moves) {
    game.move(move);
    let value = minimax(game, depth - 1, !isMaximizing, -10000, 10000);
    game.undo();
    if (isMaximizing ? value > bestValue : value < bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }
  return bestMove;
}

function minimax(game, depth, isMaximizing, alpha, beta) {
  if (depth === 0 || game.isGameOver()) return evaluateBoard(game);
  const moves = game.moves();
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      let evalue = minimax(game, depth - 1, false, alpha, beta);
      game.undo();
      maxEval = Math.max(maxEval, evalue);
      alpha = Math.max(alpha, evalue);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      let evalue = minimax(game, depth - 1, true, alpha, beta);
      game.undo();
      minEval = Math.min(minEval, evalue);
      beta = Math.min(beta, evalue);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function evaluateBoard(game) {
  const values = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
  let score = 0;
  game.board().flat().forEach(p => {
    if (p) score += (p.color === 'w' ? values[p.type] : -values[p.type]);
  });
  return score;
}