export function getBestMove(game, dificultad) {
  const moves = game.moves();
  if (moves.length === 0) return null;

  const totalPieces = game.board().flat().filter(p => p !== null).length;
  // Profundidad dinámica: más profundo si hay pocas piezas
  let depth = dificultad === 4 ? (totalPieces < 15 ? 5 : 4) : 2;
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

// Tablas de valores posicionales para que la IA sepa dónde colocar las piezas
const weights = {
  p: [
    [100, 100, 100, 100, 100, 100, 100, 100],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ],
  n: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
  ],
  // ... se pueden agregar para b, r, q, k para mayor precisión
};

function evaluateBoard(game) {
  const values = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
  let score = 0;
  const board = game.board();

  board.forEach((row, i) => {
    row.forEach((p, j) => {
      if (p) {
        let baseValue = values[p.type];
        
        // Añadir bono por posición si existe en la tabla (ej. peones y caballos)
        if (weights[p.type]) {
          baseValue += (p.color === 'w' ? weights[p.type][i][j] : weights[p.type][7 - i][j]);
        }

        score += (p.color === 'w' ? baseValue : -baseValue);
      }
    });
  });
  return score;
}