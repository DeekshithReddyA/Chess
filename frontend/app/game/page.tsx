// "use client";
// import { useState, useEffect, useRef, ReactElement } from "react";
// import Image from "next/image";
// import { Chess, Square, Piece } from "chess.js";
// import axios from "axios";
// import React from "react";

// type PieceCode = "wr" | "wn" | "wb" | "wq" | "wk" | "wp" | "br" | "bn" | "bb" | "bq" | "bk" | "bp";
// type Position = string; // Format: "a1", "h8", etc.

// interface ChessPiece {
//   square: Square;
//   piece: Piece;
// }

// interface MoveHistory {
//   san: string;
//   color: 'w' | 'b';
//   moveNumber: number;
// }

// interface AiMoveResponse {
//   fen: string;
//   gameOver: boolean;
//   checkmate: boolean;
//   stalemate: boolean;
//   draw: boolean;
//   inCheck: boolean;
//   turn: 'w' | 'b';
//   move?: {
//     from: string;
//     to: string;
//     san: string;
//   };
//   possibilities?: number;
//   error?: string;
// }

// export default function Game(): ReactElement {
//   const rows: string[] = ["8", "7", "6", "5", "4", "3", "2", "1"];
//   const cols: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
  
//   // Chess.js game state
//   const chessRef = useRef<Chess>(new Chess());
//   const audioRef = useRef<HTMLAudioElement>(null);
//   const [possibilities, setPossibilities] = useState<number>(0);
//   const [pieces, setPieces] = useState<ChessPiece[]>([]);
//   const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
//   const [validMoves, setValidMoves] = useState<Square[]>([]);
//   const [draggingPiece, setDraggingPiece] = useState<Square | null>(null);
//   const [gameOver, setGameOver] = useState<boolean>(false);
//   const [gameStatus, setGameStatus] = useState<string>("");
//   const [depth, setDepth] = useState<number>(2);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [moveHistory, setMoveHistory] = useState<MoveHistory[]>([]);
//   const [moveNumber, setMoveNumber] = useState<number>(0);
  
//   // Initialize board on component mount
//   useEffect(() => {
//     updateBoardState();
//   }, []);
  
//   // Update the visual board state from chess.js
//   const updateBoardState = () => {
//     const newPieces: ChessPiece[] = [];
    
//     // Loop through the board squares and get pieces
//     for (let i = 0; i < 8; i++) {
//       for (let j = 0; j < 8; j++) {
//         const square = cols[j] + rows[i];
//         const piece = chessRef.current.get(square as Square);
//         const sq = square as Square;
//         if (piece) {
//           newPieces.push({ square: sq, piece });
//         }
//       }
//     }
    
//     setPieces(newPieces);
//   };
  
//   // Convert chess.js piece notation to our piece code
//   const getPieceCode = (piece: Piece): PieceCode => {
//     return `${piece.color}${piece.type}` as PieceCode;
//   };
  
//   // Make a move and request AI response
//   const makeMove = async (from: Square, to: Square) => {
//     try {
//       setIsLoading(true);
      
//       // Only allow white moves
//       const piece = chessRef.current.get(from);
//       if (!piece || piece.color !== 'w' || chessRef.current.turn() !== 'w') {
//         console.log("Not your turn or not a white piece");
//         setIsLoading(false);
//         return false;
//       }
      
//       // Try to make the move locally
//       const move = chessRef.current.move({
//         from: from,
//         to: to,
//         promotion: 'q' // Always promote to queen for simplicity
//       });
      
//       if (!move) {
//         console.log("Invalid move");
//         setIsLoading(false);
//         return false;
//       }
      
//       // Add player move to history
//       const fullMoveNumber = moveNumber;
//       setMoveNumber(fullMoveNumber + 1);
//       setMoveHistory(prev => [...prev, {
//         san: move.san,
//         color: 'w',
//         moveNumber: fullMoveNumber
//       }]);
      
//       // Play sound
//       if (audioRef.current) {
//         audioRef.current.currentTime = 0;
//         audioRef.current.play();
//       }
      
//       // Update board after player's move
//       updateBoardState();
      
//       // Send move to server and get AI response
//       const response = await axios.post<AiMoveResponse>(
//         "http://localhost:4040/game/move", 
//         {
//           fen: chessRef.current.fen(),
//           move: `${from}${to}`,
//           depth
//         }
//       );
      
//       console.log("Server response:", response.data);
      
//       // Update possibilities count
//       if (response.data.possibilities) {
//         setPossibilities(response.data.possibilities);
//       }
      
//       // Check game state
//       if (response.data.gameOver) {
//         setGameOver(true);
//         if (response.data.checkmate) {
//           setGameStatus(chessRef.current.turn() === 'w' ? "Black wins by checkmate!" : "White wins by checkmate!");
//         } else if (response.data.stalemate) {
//           setGameStatus("Game drawn by stalemate");
//         } else if (response.data.draw) {
//           setGameStatus("Game drawn");
//         }
//       }
      
//       // Make AI move if provided
//       if (response.data.move && !response.data.gameOver) {
//         // Update local board with AI move
//         chessRef.current.load(response.data.fen);
        
//         // Add AI move to history
//         if (response.data.move.san) {
//           console.log(chessRef.current.history());
//           const aiMoveNumber = moveNumber;
//           setMoveNumber(aiMoveNumber + 1);
//           console.log(moveNumber);
//           setMoveHistory(prev => [...prev, {
//             san: response.data.move?.san || '',
//             color: 'b',
//             moveNumber: aiMoveNumber
//           }]);
//         }
        
//         // Play sound for AI move
//         if (audioRef.current) {
//           audioRef.current.currentTime = 0;
//           audioRef.current.play();
//         }
        
//         // Update board after AI move
//         updateBoardState();
//       }
      
//       setIsLoading(false);
//       return true;
//     } catch (error) {
//       console.error("Error making move:", error);
//       setIsLoading(false);
//       return false;
//     }
//   };
  
//   // Handle click on a square
//   const handleSquareClick = async (square: Square) => {
//     // If already loading, don't allow new moves
//     if (isLoading || gameOver) return;
    
//     // If we already have a selected piece, try to move it
//     if (selectedPiece) {
//       // If clicking on a different square, attempt to make a move
//       if (square !== selectedPiece) {
//         await makeMove(selectedPiece, square);
//       }
      
//       // Clear selection either way
//       setSelectedPiece(null);
//       setValidMoves([]);
//       return;
//     }
    
//     // Check if the square has a piece that can be moved
//     const piece = chessRef.current.get(square);
//     if (piece && piece.color === 'w' && chessRef.current.turn() === 'w') {
//       setSelectedPiece(square);
      
//       // Calculate valid moves for this piece
//       const moves = chessRef.current.moves({
//         square: square,
//         verbose: true
//       });
      
//       // Extract destination squares
//       const validSquares = moves.map(move => move.to as Square);
//       setValidMoves(validSquares);
//     }
//   };
  
//   // Start dragging a piece
//   const handleDragStart = (e: React.DragEvent, square: Square) => {
//     // If already loading or game over, don't allow new moves
//     if (isLoading || gameOver) return;
    
//     const piece = chessRef.current.get(square);
//     if (piece && piece.color === 'w' && chessRef.current.turn() === 'w') {
//       setDraggingPiece(square);
//       setSelectedPiece(square);
      
//       // Calculate valid moves
//       const moves = chessRef.current.moves({
//         square: square,
//         verbose: true
//       });
      
//       const validSquares = moves.map(move => move.to as Square);
//       setValidMoves(validSquares);
      
//       // Set drag image (optional)
//       if (e.dataTransfer) {
//         e.dataTransfer.effectAllowed = "move";
//       }
//     }
//   };
  
//   // Allow drop on squares
//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     if (e.dataTransfer) {
//       e.dataTransfer.dropEffect = "move";
//     }
//   };
  
//   // Handle dropping a piece
//   const handleDrop = async (e: React.DragEvent, targetSquare: Square) => {
//     e.preventDefault();
    
//     // If already loading or game over, don't allow new moves
//     if (isLoading || gameOver || !draggingPiece) return;
    
//     // Check if this is a valid move
//     if (validMoves.includes(targetSquare)) {
//       await makeMove(draggingPiece, targetSquare);
//     }
    
//     // Reset drag state
//     setDraggingPiece(null);
//     setSelectedPiece(null);
//     setValidMoves([]);
//   };
  
//   // End dragging without a drop
//   const handleDragEnd = () => {
//     setDraggingPiece(null);
//     setSelectedPiece(null);
//     setValidMoves([]);
//   };
  
//   // Reset the game
//   const resetGame = async () => {
//     try {
//       setIsLoading(true);
//       chessRef.current.reset();
      
//       const response = await axios.post("http://localhost:4040/game/reset");
//       setMoveNumber(0);
//       setGameOver(false);
//       setGameStatus("");
//       setPossibilities(0);
//       setMoveHistory([]);
//       updateBoardState();
//       setIsLoading(false);
//     } catch (error) {
//       console.error("Error resetting game:", error);
//       setIsLoading(false);
//     }
//   };
  
//   // Render a piece image
//   const getPieceImage = (pieceCode: PieceCode, square: Square): ReactElement => {
//     const isPlayerPiece = pieceCode.startsWith('w') && chessRef.current.turn() === 'w' && !gameOver;
    
//     return (
//       <div>
//         <Image 
//           src={`/${pieceCode}.png`} 
//           alt={pieceCode} 
//           width={50} 
//           height={50} 
//           priority={true}
//           draggable={isPlayerPiece}
//           onDragStart={(e) => isPlayerPiece ? handleDragStart(e, square) : undefined}
//           onDragEnd={handleDragEnd}
//           className={isPlayerPiece ? "cursor-grab active:cursor-grabbing" : "cursor-default"} 
//         />
//       </div>
//     );
//   };
  
//   // Check if a square has a piece
//   const getPieceOnSquare = (square: Square): ChessPiece | undefined => {
//     return pieces.find(p => p.square === square);
//   };
  
//   // Render a single cell
//   const renderCell = (col: string, row: string, isWhiteCell: boolean): ReactElement => {
//     const square = col + row as Square;
//     const pieceData = getPieceOnSquare(square);
//     const isSelected = selectedPiece === square;
//     const isValidMove = validMoves.includes(square);
    
//     let bgColor = isWhiteCell ? "bg-white" : "bg-green-500";
    
//     if (isSelected) {
//       bgColor = "bg-yellow-200";
//     }
    
//     return (
//       <div 
//         key={square} 
//         className={`w-16 h-16 border border-1 ${bgColor} flex items-center justify-center relative`}
//         onClick={() => handleSquareClick(square)}
//         onDragOver={handleDragOver}
//         onDrop={(e) => handleDrop(e, square)}
//       >
//         {pieceData && getPieceImage(getPieceCode(pieceData.piece), square)}
        
//         {/* Valid move indicator */}
//         {isValidMove && !pieceData && (
//           <div className="absolute w-6 h-6 rounded-full bg-gray-500 opacity-50"></div>
//         )}
        
//         {/* Valid capture indicator */}
//         {isValidMove && pieceData && (
//           <div className="absolute inset-1 border border-5 border-gray-500/50 rounded-full" style={{zIndex: 10}}></div>
//         )}
//       </div>
//     );
//   };

//   // Render the move history box
//   const renderMoveHistory = () => {
//     // Better approach: organize the move history into a structured format
//     const organizedMoves: Record<number, {white?: string, black?: string}> = {};
    
//     // First, organize the moves by move number
//     moveHistory.forEach(move => {
//       if (!organizedMoves[move.moveNumber]) {
//         organizedMoves[move.moveNumber] = {};
//       }
      
//       if (move.color === 'w') {
//         organizedMoves[move.moveNumber].white = move.san;
//       } else if (move.color === 'b') {
//         organizedMoves[move.moveNumber].black = move.san;
//       }
//     });
    
//     // Convert to array for rendering
//     const moveRows = Object.entries(organizedMoves).map(([moveNumber, moves]) => ({
//       number: parseInt(moveNumber),
//       white: moves.white || '',
//       black: moves.black || ''
//     }));
    
//     // Sort by move number
//     moveRows.sort((a, b) => a.number - b.number);
    
//     return (
//       <div className="w-64 mt-32 h-full bg-white p-4 rounded-lg shadow-lg overflow-y-auto min-h-96 max-h-102">
//         <h2 className="text-xl text-black font-bold mb-2 text-center">Move History</h2>
//         {moveRows.length === 0 ? (
//           <div className="text-gray-500 text-center">No moves yet</div>
//         ) : (
//           <div className="grid grid-cols-3 gap-2 text-black">
//             <div className="font-bold text-center">Move</div>
//             <div className="font-bold text-center">White</div>
//             <div className="font-bold text-center">Black</div>
            
//             {moveRows.map((row) => (
//               <React.Fragment key={row.number}>
//                 <div className="text-center">{row.number}.</div>
//                 <div className="text-center">{row.white}</div>
//                 <div className="text-center">{row.black}</div>
//               </React.Fragment>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="flex bg-gray-100">
//       {/* Moves History Box */}
//       <div className="h-full p-4 flex items-center">
//         {/* {JSON.stringify(moveHistory)} */}
//         {renderMoveHistory()}
//       </div>
      
//       {/* Game Board */}
//       <div className="flex flex-col items-center justify-center min-w-2/3 min-h-screen bg-gray-100 p-2">
//         <h1 className="text-3xl text-black font-bold mb-1">Chess Game</h1>
        
//         {gameOver && (
//           <div className="text-xl font-semibold text-red-600 mb-4">
//             {gameStatus || "Game Over"}
//           </div>
//         )}
        
//         <div className={`text-lg ${isLoading? "text-blue-600" : "text-gray-100"} mb-4`}>
//           AI is thinking...
//         </div>
        
//         <audio ref={audioRef} src="/move.wav" />
        
//         <div className="bg-white p-4 rounded-lg shadow-lg">
//           <div className="flex flex-col">
//             {/* Column labels - top */}
//             <div className="ml-10 flex space-x-10">
//               {cols.map((col, i) => (
//                 <div key={`col-top-${i}`} className="text-center w-6 text-black">{col}</div>
//               ))}
//             </div>
            
//             {/* Board rows */}
//             {rows.map((row, i) => (
//               <div key={`row-${i}`} className="flex">
//                 {/* Row label - left */}
//                 <div className="mt-6 mr-2 text-black">{row}</div>
                
//                 {/* Chess cells */}
//                 {cols.map((col, j) => renderCell(col, row, (i + j) % 2 === 0))}
                
//                 {/* Row label - right */}
//                 <div className="mt-6 ml-2 text-black">{row}</div>
//               </div>
//             ))}
            
//             {/* Column labels - bottom */}
//             <div className="ml-10 flex space-x-10">
//               {cols.map((col, i) => (
//                 <div key={`col-bottom-${i}`} className="text-center w-6 text-black">{col}</div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
      
//       {/* Controls Section */}
//       <div className="bg-gray-100">
//         <div className="flex flex-col items-center justify-center min-h-screen p-2 mr-10">
//           <div className="m-2 text-black">
//             <div className="text-center mb-1">
//               AI Difficulty: Depth of minimax search (# of moves the AI looks ahead)
//             </div>
//             <div className="flex justify-center items-center">
//               <button 
//                 onClick={() => setDepth(d => Math.max(1, d - 1))}
//                 className="px-3 py-1 bg-gray-300 rounded-l"
//                 disabled={depth <= 1}
//               >
//                 -
//               </button>
//               <div className="px-4 py-1 bg-white border-t border-b">{depth}</div>
//               <button 
//                 onClick={() => setDepth(d => Math.min(5, d + 1))}
//                 className="px-3 py-1 bg-gray-300 rounded-r"
//                 disabled={depth >= 6}
//               >
//                 +
//               </button>
//             </div>
//           </div>
//           <div className="mb-4">
//             <div className="text-lg text-black">
//               Possibilities analyzed: {possibilities}
//             </div>
//           </div>
//           <div className="mb-4">
//             <button 
//               onClick={resetGame} 
//               className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//               disabled={isLoading}
//             >
//               Reset Game
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// Game.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import axios from "axios";
import { ChessPiece, MoveHistory as MoveHistoryType, GameResponse } from './types';
import ChessBoard from './ChessBoard';
import MoveHistory from './MoveHistory';
import GameControls from './GameControls';

// API base URL - adjust based on your backend
const API_BASE_URL = "https://chess-backend.deekshithreddy.site.com";

export default function Game() {
  // Chess.js game state
  const chessRef = useRef<Chess>(new Chess());
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // State variables
  const [gameId, setGameId] = useState<string>("");
  const [pieces, setPieces] = useState<ChessPiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [draggingPiece, setDraggingPiece] = useState<Square | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<string>("");
  const [depth, setDepth] = useState<number>(2);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryType[]>([]);
  const [moveNumber, setMoveNumber] = useState<number>(0);
  const [possibilities, setPossibilities] = useState<number>(0);
  
  // Initialize game on component mount
  useEffect(() => {
    createNewGame();
  }, []);
  
  // Create a new game session
  const createNewGame = async () => {
    try {
      const response = await axios.post<{game_id: string}>(`${API_BASE_URL}/game/create`);
      setGameId(response.data.game_id);
      chessRef.current.reset();
      updateBoardState();
      setGameOver(false);
      setGameStatus("");
      setMoveHistory([]);
      setMoveNumber(0);
      setPossibilities(0);
    } catch (error) {
      console.error("Error creating new game:", error);
    }
  };
  
  // Update the visual board state from chess.js
  const updateBoardState = () => {
    const newPieces: ChessPiece[] = [];
    const cols: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const rows: string[] = ["8", "7", "6", "5", "4", "3", "2", "1"];
    
    // Loop through the board squares and get pieces
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = cols[j] + rows[i];
        const piece = chessRef.current.get(square as Square);
        const sq = square as Square;
        if (piece) {
          newPieces.push({ square: sq, piece });
        }
      }
    }
    
    setPieces(newPieces);
  };
  
  // Make a move and request AI response
  const makeMove = async (from: Square, to: Square) => {
    try {
      setIsLoading(true);
      
      // Only allow white moves
      const piece = chessRef.current.get(from);
      if (!piece || piece.color !== 'w' || chessRef.current.turn() !== 'w') {
        console.log("Not your turn or not a white piece");
        setIsLoading(false);
        return false;
      }
      
      // Try to make the move locally
      const move = chessRef.current.move({
        from: from,
        to: to,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      if (!move) {
        console.log("Invalid move");
        setIsLoading(false);
        return false;
      }
      
      // Add player move to history
      const fullMoveNumber = moveNumber;
      setMoveNumber(fullMoveNumber + 1);
      setMoveHistory(prev => [...prev, {
        san: move.san,
        color: 'w',
        moveNumber: fullMoveNumber
      }]);
      
      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      
      // Update board after player's move
      updateBoardState();
      
      // Send move to server and get AI response
      const response = await axios.post<GameResponse>(
        `${API_BASE_URL}/game/move`, 
        {
          game_id: gameId,
          move: `${from}${to}`,
          depth
        }
      );

      console.log(response.data);
      if(response.data.possibilities){
        setPossibilities(parseInt(response.data.possibilities));
      }
      
      // Check game state after player move
      if (response.data.gameOver) {
        setGameOver(true);
        if (response.data.checkmate) {
          setGameStatus(chessRef.current.turn() === 'w' ? "Black wins by checkmate!" : "White wins by checkmate!");
        } else if (response.data.stalemate) {
          setGameStatus("Game drawn by stalemate");
        } else if (response.data.draw) {
          setGameStatus("Game drawn");
        }
        
        setIsLoading(false);
        return true;
      }
      
      // Make AI move if provided
      if (response.data.aiMove) {
        // Extract AI move details
        const aiMoveUci = response.data.aiMove.uci;
        const aiMoveSan = response.data.aiMove.san;
        
        // Parse from/to squares from UCI format
        const aiMoveFrom = aiMoveUci.substring(0, 2) as Square;
        const aiMoveTo = aiMoveUci.substring(2, 4) as Square;
        
        // Make AI move locally
        chessRef.current.move({
          from: aiMoveFrom,
          to: aiMoveTo,
          promotion: aiMoveUci.length > 4 ? aiMoveUci[4] : undefined
        });
        
        // Add AI move to history
        const aiMoveNumber = moveNumber;
        setMoveNumber(aiMoveNumber + 1);
        setMoveHistory(prev => [...prev, {
          san: aiMoveSan,
          color: 'b',
          moveNumber: aiMoveNumber
        }]);
        
        // Play sound for AI move
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }

        
        
        // Check game state after AI move
        if (response.data.gameOver) {
          setGameOver(true);
          if (response.data.checkmate) {
            setGameStatus(chessRef.current.turn() === 'w' ? "Black wins by checkmate!" : "White wins by checkmate!");
          } else if (response.data.stalemate) {
            setGameStatus("Game drawn by stalemate");
          } else if (response.data.draw) {
            setGameStatus("Game drawn");
          }
        }
        
        // Update board after AI move
        updateBoardState();
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error making move:", error);
      setIsLoading(false);
      return false;
    }
  };
  
  // Handle click on a square
  const handleSquareClick = async (square: Square) => {
    // If already loading, don't allow new moves
    if (isLoading || gameOver) return;
    
    // If we already have a selected piece, try to move it
    if (selectedPiece) {
      // If clicking on a different square, attempt to make a move
      if (square !== selectedPiece) {
        await makeMove(selectedPiece, square);
      }
      
      // Clear selection either way
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }
    
    // Check if the square has a piece that can be moved
    const piece = chessRef.current.get(square);
    if (piece && piece.color === 'w' && chessRef.current.turn() === 'w') {
      setSelectedPiece(square);
      
      // Calculate valid moves for this piece
      const moves = chessRef.current.moves({
        square: square,
        verbose: true
      });
      
      // Extract destination squares
      const validSquares = moves.map(move => move.to as Square);
      setValidMoves(validSquares);
    }
  };
  
  // Start dragging a piece
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    // If already loading or game over, don't allow new moves
    if (isLoading || gameOver) return;
    
    const piece = chessRef.current.get(square);
    if (piece && piece.color === 'w' && chessRef.current.turn() === 'w') {
      setDraggingPiece(square);
      setSelectedPiece(square);
      
      // Calculate valid moves
      const moves = chessRef.current.moves({
        square: square,
        verbose: true
      });
      
      const validSquares = moves.map(move => move.to as Square);
      setValidMoves(validSquares);
      
      // Set drag image (optional)
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
      }
    }
  };
  
  // Allow drop on squares
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  };
  
  // Handle dropping a piece
  const handleDrop = async (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    
    // If already loading or game over, don't allow new moves
    if (isLoading || gameOver || !draggingPiece) return;
    
    // Check if this is a valid move
    if (validMoves.includes(targetSquare)) {
      await makeMove(draggingPiece, targetSquare);
    }
    
    // Reset drag state
    setDraggingPiece(null);
    setSelectedPiece(null);
    setValidMoves([]);
  };
  
  // End dragging without a drop
  const handleDragEnd = () => {
    setDraggingPiece(null);
    setSelectedPiece(null);
    setValidMoves([]);
  };
  
  // Reset the game
  const resetGame = async () => {
    try {
      setIsLoading(true);
      
      if (gameId) {
        await axios.post(`${API_BASE_URL}/game/reset/${gameId}`);
      } else {
        await createNewGame();
      }
      
      chessRef.current.reset();
      setMoveNumber(0);
      setGameOver(false);
      setGameStatus("");
      setPossibilities(0);
      setMoveHistory([]);
      updateBoardState();
      setIsLoading(false);
    } catch (error) {
      console.error("Error resetting game:", error);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex bg-gray-100">
      {/* Moves History */}
      <div className="h-full p-4 flex items-center">
        <MoveHistory moveHistory={moveHistory} />
      </div>
      
      {/* Game Board */}
      <div className="flex flex-col items-center justify-center min-w-2/3 min-h-screen bg-gray-100 p-2">
        <h1 className="text-3xl text-black font-bold mb-1">Chess Game</h1>
        
        {gameOver && (
          <div className="text-xl font-semibold text-red-600 mb-4">
            {gameStatus || "Game Over"}
          </div>
        )}
        
        <div className={`text-lg ${isLoading ? "text-blue-600" : "text-gray-100"} mb-4`}>
          AI is thinking...
        </div>
        
        <audio ref={audioRef} src="/move.wav" />
        
        <ChessBoard
          pieces={pieces}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          isTurn={chessRef.current.turn() === 'w'}
          isGameOver={gameOver}
          handleSquareClick={handleSquareClick}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
        />
      </div>
      
      {/* Controls Section */}
      <div className="text-black">


      </div>
      <div className="bg-gray-100">
        <GameControls
          depth={depth}
          possibilities={possibilities}
          isLoading={isLoading}
          setDepth={setDepth}
          resetGame={resetGame}
        />
      </div>
    </div>
  );
}