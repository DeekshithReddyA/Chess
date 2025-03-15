// import express from "express";
// import { Chess , Square, PieceSymbol, Color } from "chess.js";
// import cors from "cors";
// import { createCanvas } from "canvas";
// import fs from "fs";

// interface pieceValues{
//     [key: string]: number;
// }

// type Board = ({
//     square: Square;
//     type: PieceSymbol;
//     color: Color;
// } | null)[][]

// const app = express();
// app.use(express.json());
// app.use(cors());

// const chess = new Chess();

// const squareSize = 50;
// const boardSize = squareSize * 8;
// const pieceSymbols: { [key: string]: string } = {
//     'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
//     'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
// };

// let possibilities = 0;

// function generateChessboardImage(fen: string, filename: string) {
//     const chess = new Chess(fen);
//     const canvas = createCanvas(boardSize, boardSize);
//     const ctx = canvas.getContext("2d");

//     // Draw the chessboard
//     ctx.fillStyle = "#f0d9b5";
//     ctx.fillRect(0, 0, boardSize, boardSize);
//     ctx.fillStyle = "#b58863";
//     for (let i = 0; i < 8; i++) {
//         for (let j = 0; j < 8; j++) {
//             if ((i + j) % 2 === 1) {
//                 ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
//             }
//         }
//     }
    
//     // Draw pieces
//     const board = chess.board();
//     ctx.font = "40px Arial";
//     ctx.textAlign = "center";
//     ctx.textBaseline = "middle";
//     for (let rank = 0; rank < 8; rank++) {
//         for (let file = 0; file < 8; file++) {
//             const piece = board[rank][file];
//             if (piece) {
//                 const symbol = pieceSymbols[piece.type];
//                 ctx.fillStyle = piece.color === "w" ? "white" : "black";
//                 ctx.fillText(symbol, (file + 0.5) * squareSize, (7 - rank + 0.5) * squareSize);
//             }
//         }
//     }
    
//     // Save the canvas as an image
//     const buffer = canvas.toBuffer("image/png");
//     fs.writeFileSync(filename, buffer);
// }

// function saveChessboardImages(moves: { after: string, san: string, before: string }[]) {
//     moves.forEach((move, index) => {
//         const filename = `/media/deeks/New Volume/Projects/chess/backend/possibilities/chessboard_${index + 1}.png`;
//         generateChessboardImage(move.after, filename);
//         console.log(`Saved: ${filename}`);
//     });
// }



// // Minimax AI with Alpha-Beta Pruning
// function evaluateBoard(board: Board) {
//     const pieceValues: pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
//     let evaluation = 0;

//     for (const row of board) {
//         for (const square of row) {
//             if (square) {
//                 const value = pieceValues[square.type] || 0;
//                 evaluation += square.color === 'w' ? -value : value;
//             }
//         }
//     }
//     return evaluation;
// }

// function minimax(chess: Chess ,depth: number, isMaximizing: boolean, alpha: number, beta: number) {
//     if (depth === 0 || chess.isGameOver()) {
//         return evaluateBoard(chess.board());
//     }

//     const moves = chess.moves({ verbose: true });
//     let bestValue = isMaximizing ? -Infinity : Infinity;
    
//     for (const move of moves) {
//         chess.move(move.lan);
//         possibilities++;
//         const boardValue = minimax(chess, depth - 1, !isMaximizing, alpha, beta);
//         chess.undo();
        
//         if (isMaximizing) {
//             bestValue = Math.max(bestValue, boardValue);
//             alpha = Math.max(alpha, boardValue);
//         } else {
//             bestValue = Math.min(bestValue, boardValue);
//             beta = Math.min(beta, boardValue);
//         }
        
//         if (beta <= alpha) break; // Alpha-Beta Pruning
//     }
//     return bestValue;
// }

// function findBestMove(chess: Chess, depth: number) {
//     let bestMove = null;
//     let bestValue = -Infinity;
//     const moves = chess.moves({ verbose: true });
//     console.log(depth);
    
//     for (const move of moves) {
//         chess.move(move.lan);
//         possibilities++;
//         const boardValue = minimax(chess ,depth, false, -Infinity, Infinity);
//         chess.undo();
        
//         if (boardValue > bestValue) {
//             bestValue = boardValue;
//             bestMove = move.lan;
//         }
//     }
//     return bestMove;
// }


// app.post('/game/move', (req, res) => {
//     const {fen,  move , depth } = req.body;
//     if (!chess.move(move)) {
//         res.status(400).json({ error: 'Invalid move' });
//         return;
//     }
//     let aiMove;
//     if (!chess.isGameOver()) {
//         aiMove = findBestMove(chess, depth);
//         console.log(aiMove);
//         console.log(possibilities)
//         if(aiMove)
//             chess.move(aiMove);

//     }
//     res.json({ move: aiMove , gameOver: chess.isGameOver() , possibilities });
//     possibilities = 0;
// });

// app.post('/game/reset', (req, res) => {
//     chess.reset();
//     res.json({ board: chess.fen() });
// });

// const PORT = 4000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from "express";
import { Chess, Square, PieceSymbol, Color } from "chess.js";
import cors from "cors";
import { createCanvas } from "canvas";
import fs from "fs";

interface PieceValues {
    [key: string]: number;
}

type Board = ({
    square: Square;
    type: PieceSymbol;
    color: Color;
} | null)[][]

interface ChessMove {
    from: string;
    to: string;
    lan: string;
    san: string;
    captured?: PieceSymbol;
    promotion?: PieceSymbol;
}

const app = express();
app.use(express.json());
app.use(cors());

const chess = new Chess();

const squareSize = 50;
const boardSize = squareSize * 8;
const pieceSymbols: { [key: string]: string } = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

let possibilities = 0;

function generateChessboardImage(fen: string, filename: string) {
    const chess = new Chess(fen);
    const canvas = createCanvas(boardSize, boardSize);
    const ctx = canvas.getContext("2d");

    // Draw the chessboard
    ctx.fillStyle = "#f0d9b5";
    ctx.fillRect(0, 0, boardSize, boardSize);
    ctx.fillStyle = "#b58863";
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if ((i + j) % 2 === 1) {
                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
            }
        }
    }
    
    // Draw pieces
    const board = chess.board();
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            const piece = board[rank][file];
            if (piece) {
                const symbol = pieceSymbols[piece.type];
                ctx.fillStyle = piece.color === "w" ? "white" : "black";
                ctx.fillText(symbol, (file + 0.5) * squareSize, (7 - rank + 0.5) * squareSize);
            }
        }
    }
    
    // Save the canvas as an image
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(filename, buffer);
}

function saveChessboardImages(moves: { after: string, san: string, before: string }[]) {
    moves.forEach((move, index) => {
        const filename = `/media/deeks/New Volume/Projects/chess/backend/possibilities/chessboard_${index + 1}.png`;
        generateChessboardImage(move.after, filename);
        console.log(`Saved: ${filename}`);
    });
}

// Minimax AI with Alpha-Beta Pruning
function evaluateBoard(board: Board) {
    const pieceValues: PieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
    let evaluation = 0;

    for (const row of board) {
        for (const square of row) {
            if (square) {
                const value = pieceValues[square.type] || 0;
                evaluation += square.color === 'w' ? -value : value;
            }
        }
    }
    return evaluation;
}

function minimax(chess: Chess, depth: number, isMaximizing: boolean, alpha: number, beta: number) {
    if (depth === 0 || chess.isGameOver()) {
        return evaluateBoard(chess.board());
    }

    const moves = chess.moves({ verbose: true }) as ChessMove[];
    let bestValue = isMaximizing ? -Infinity : Infinity;
    
    for (const move of moves) {
        chess.move(move.lan);
        possibilities++;
        const boardValue = minimax(chess, depth - 1, !isMaximizing, alpha, beta);
        chess.undo();
        
        if (isMaximizing) {
            bestValue = Math.max(bestValue, boardValue);
            alpha = Math.max(alpha, boardValue);
        } else {
            bestValue = Math.min(bestValue, boardValue);
            beta = Math.min(beta, boardValue);
        }
        
        if (beta <= alpha) break; // Alpha-Beta Pruning
    }
    return bestValue;
}

function findBestMove(chess: Chess, depth: number) {
    let bestMove: ChessMove | null = null;
    let bestValue = -Infinity;
    const moves = chess.moves({ verbose: true }) as ChessMove[];
    
    for (const move of moves) {
        chess.move(move.lan);
        possibilities++;
        const boardValue = minimax(chess, depth, false, -Infinity, Infinity);
        chess.undo();
        
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }
    return bestMove;
}

app.post('/game/move', (req, res) => {
    const { fen, move, depth } = req.body;
    
    try {
        // Check if the current turn is white
        if (chess.turn() === 'b') {
            res.status(400).json({ 
                error: 'It is not your turn. The AI (black) is thinking...' 
            });
            return;
        }

        // Process player's (white) move
        if (!chess.move(move)) {
            res.status(400).json({ error: 'Invalid move' });
            return;
        }

        // Check if the game is over after player's move
        if (chess.isGameOver()) {
            res.json({ 
                fen: chess.fen(),
                gameOver: true,
                checkmate: chess.isCheckmate(),
                stalemate: chess.isStalemate(),
                draw: chess.isDraw(),
                inCheck: chess.isCheck(),
                turn: chess.turn()
            });
            return;
        }

        // Now it's black's turn (AI's turn)
        const aiMoveObj = findBestMove(chess, depth || 3);
        
        if (aiMoveObj) {
            chess.move(aiMoveObj.lan);
            
            // Return the game state after AI's move
            res.json({
                fen: chess.fen(),
                gameOver: chess.isGameOver(),
                checkmate: chess.isCheckmate(),
                stalemate: chess.isStalemate(),
                draw: chess.isDraw(),
                inCheck: chess.isCheck(),
                turn: chess.turn(),
                move: {
                    from: aiMoveObj.from,
                    to: aiMoveObj.to,
                    san: aiMoveObj.san
                },
                possibilities
            });
            return;
        } else {
            res.status(500).json({ error: 'AI could not find a valid move' });
            return;
        }
    } catch (error) {
        console.error('Error processing move:', error);
        res.status(500).json({ error: 'Server error during move processing' });
        return;
    } finally {
        possibilities = 0;
    }
});

app.post('/game/reset', (req, res) => {
    chess.reset();
    possibilities = 0;
    res.json({ 
        fen: chess.fen(),
        turn: chess.turn()
    });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));