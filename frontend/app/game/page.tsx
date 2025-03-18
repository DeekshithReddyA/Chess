

// "use client";
// import { useState, useEffect, useRef } from "react";
// import { Chess, Square } from "chess.js";
// import axios from "axios";
// import { ChessPiece, MoveHistory as MoveHistoryType, GameResponse } from './types';
// import ChessBoard from './ChessBoard';
// import MoveHistory from './MoveHistory';
// import GameControls from './GameControls';

// // API base URL - adjust based on your backend
// const API_BASE_URL = "https://chess-backend.deekshithreddy.site";

// export default function Game() {
//   // Chess.js game state
//   const chessRef = useRef<Chess>(new Chess());
//   const audioRef = useRef<HTMLAudioElement>(null);
  
//   // State variables
//   const [gameId, setGameId] = useState<string>("");
//   const [pieces, setPieces] = useState<ChessPiece[]>([]);
//   const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
//   const [validMoves, setValidMoves] = useState<Square[]>([]);
//   const [draggingPiece, setDraggingPiece] = useState<Square | null>(null);
//   const [gameOver, setGameOver] = useState<boolean>(false);
//   const [gameStatus, setGameStatus] = useState<string>("");
//   const [depth, setDepth] = useState<number>(2);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [moveHistory, setMoveHistory] = useState<MoveHistoryType[]>([]);
//   const [moveNumber, setMoveNumber] = useState<number>(0);
//   const [possibilities, setPossibilities] = useState<number>(0);
  
//   // Initialize game on component mount
//   useEffect(() => {
//     createNewGame();
//   }, []);
  
//   // Create a new game session
//   const createNewGame = async () => {
//     try {
//       const response = await axios.post<{game_id: string}>(`${API_BASE_URL}/game/create`);
//       setGameId(response.data.game_id);
//       chessRef.current.reset();
//       updateBoardState();
//       setGameOver(false);
//       setGameStatus("");
//       setMoveHistory([]);
//       setMoveNumber(0);
//       setPossibilities(0);
//     } catch (error) {
//       console.error("Error creating new game:", error);
//     }
//   };
  
//   // Update the visual board state from chess.js
//   const updateBoardState = () => {
//     const newPieces: ChessPiece[] = [];
//     const cols: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
//     const rows: string[] = ["8", "7", "6", "5", "4", "3", "2", "1"];
    
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
//       const response = await axios.post<GameResponse>(
//         `${API_BASE_URL}/game/move`, 
//         {
//           game_id: gameId,
//           move: `${from}${to}`,
//           depth
//         }
//       );

//       console.log(response.data);
//       if(response.data.possibilities){
//         setPossibilities(parseInt(response.data.possibilities));
//       }
      
//       // Check game state after player move
//       if (response.data.gameOver) {
//         setGameOver(true);
//         if (response.data.checkmate) {
//           setGameStatus(chessRef.current.turn() === 'w' ? "Black wins by checkmate!" : "White wins by checkmate!");
//         } else if (response.data.stalemate) {
//           setGameStatus("Game drawn by stalemate");
//         } else if (response.data.draw) {
//           setGameStatus("Game drawn");
//         }
        
//         setIsLoading(false);
//         return true;
//       }
      
//       // Make AI move if provided
//       if (response.data.aiMove) {
//         // Extract AI move details
//         const aiMoveUci = response.data.aiMove.uci;
//         const aiMoveSan = response.data.aiMove.san;
        
//         // Parse from/to squares from UCI format
//         const aiMoveFrom = aiMoveUci.substring(0, 2) as Square;
//         const aiMoveTo = aiMoveUci.substring(2, 4) as Square;
        
//         // Make AI move locally
//         chessRef.current.move({
//           from: aiMoveFrom,
//           to: aiMoveTo,
//           promotion: aiMoveUci.length > 4 ? aiMoveUci[4] : undefined
//         });
        
//         // Add AI move to history
//         const aiMoveNumber = moveNumber;
//         setMoveNumber(aiMoveNumber + 1);
//         setMoveHistory(prev => [...prev, {
//           san: aiMoveSan,
//           color: 'b',
//           moveNumber: aiMoveNumber
//         }]);
        
//         // Play sound for AI move
//         if (audioRef.current) {
//           audioRef.current.currentTime = 0;
//           audioRef.current.play();
//         }

        
        
//         // Check game state after AI move
//         if (response.data.gameOver) {
//           setGameOver(true);
//           if (response.data.checkmate) {
//             setGameStatus(chessRef.current.turn() === 'w' ? "Black wins by checkmate!" : "White wins by checkmate!");
//           } else if (response.data.stalemate) {
//             setGameStatus("Game drawn by stalemate");
//           } else if (response.data.draw) {
//             setGameStatus("Game drawn");
//           }
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
      
//       if (gameId) {
//         await axios.post(`${API_BASE_URL}/game/reset/${gameId}`);
//       } else {
//         await createNewGame();
//       }
      
//       chessRef.current.reset();
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
  
//   return (
//     <div className="flex bg-gray-100">
//       {/* Moves History */}
//       <div className="h-full p-4 flex items-center">
//         <MoveHistory moveHistory={moveHistory} />
//       </div>
      
//       {/* Game Board */}
//       <div className="flex flex-col items-center justify-center min-w-2/3 min-h-screen bg-gray-100 p-2">
//         <h1 className="text-3xl text-black font-bold mb-1">Chess Game</h1>
        
//         {gameOver && (
//           <div className="text-xl font-semibold text-red-600 mb-4">
//             {gameStatus || "Game Over"}
//           </div>
//         )}
        
//         <div className={`text-lg ${isLoading ? "text-blue-600" : "text-gray-100"} mb-4`}>
//           AI is thinking...
//         </div>
        
//         <audio ref={audioRef} src="/move.wav" />
        
//         <ChessBoard
//           pieces={pieces}
//           selectedPiece={selectedPiece}
//           validMoves={validMoves}
//           isTurn={chessRef.current.turn() === 'w'}
//           isGameOver={gameOver}
//           handleSquareClick={handleSquareClick}
//           handleDragStart={handleDragStart}
//           handleDragOver={handleDragOver}
//           handleDrop={handleDrop}
//           handleDragEnd={handleDragEnd}
//         />
//       </div>
      
//       {/* Controls Section */}
//       <div className="text-black">


//       </div>
//       <div className="bg-gray-100">
//         <GameControls
//           depth={depth}
//           possibilities={possibilities}
//           isLoading={isLoading}
//           setDepth={setDepth}
//           resetGame={resetGame}
//         />
//       </div>
//     </div>
//   );
// }


"use client";
import { useState, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import { io, Socket } from "socket.io-client";
import { ChessPiece, MoveHistory as MoveHistoryType, GameResponse } from './types';
import ChessBoard from './ChessBoard';
import MoveHistory from './MoveHistory';
import GameControls from './GameControls';

// API base URL - adjust based on your backend
const API_BASE_URL = "http://localhost:4040";

export default function Game() {
  // Chess.js game state
  const chessRef = useRef<Chess>(new Chess());
  const audioRef = useRef<HTMLAudioElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
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
  const [possibilities, setPossibilities] = useState<number>(0);
  const [inCheck , setInCheck] = useState<boolean>(false);
  
  // Initialize socket connection
  useEffect(() => {
    // Create socket connection
    socketRef.current = io(API_BASE_URL);
    
    // Set up event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });
    
    socketRef.current.on('game_created', (data: any) => {
      console.log('Game created:', data);
      setIsLoading(false);
      setGameId(data.game_id);
      chessRef.current.reset();
      updateBoardState();
      setGameOver(false);
      setGameStatus("");
      setMoveHistory([]);
      setPossibilities(0);
    });
    
    socketRef.current.on('move_accepted', (data: any) => {
      // Board state is already updated locally after our move
    });
    
    socketRef.current.on('ai_thinking', (data: any) => {
      setIsLoading(true);
    });
    
    socketRef.current.on('search_progress', (data: any) => {
      setPossibilities(data.positions_analyzed);
    });
    
    socketRef.current.on('ai_move_result', (data: any) => {
      
      // Extract AI move details
      const aiMoveUci = data.aiMove.uci;
      const aiMoveSan = data.aiMove.san;
      
      // Parse from/to squares from UCI format
      const aiMoveFrom = aiMoveUci.substring(0, 2) as Square;
      const aiMoveTo = aiMoveUci.substring(2, 4) as Square;
      
      // Make AI move locally
      chessRef.current.move({
        from: aiMoveFrom,
        to: aiMoveTo,
        promotion: aiMoveUci.length > 4 ? aiMoveUci[4] : undefined
      });

      if(chessRef.current.inCheck())
        setInCheck(true);
      else
        setInCheck(false);
      
      // Add AI move to history
      setMoveHistory(prev => [...prev, {
        san: aiMoveSan,
        color: 'b',
        moveNumber: chessRef.current.moveNumber() - 1
      }]);
      
      // Play sound for AI move
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      
      // Check game state
      if (data.gameOver) {
        setGameOver(true);
        if (data.checkmate) {
          setGameStatus(chessRef.current.turn() === 'w' ? "Black wins by checkmate!" : "White wins by checkmate!");
        } else if (data.stalemate) {
          setGameStatus("Game drawn by stalemate");
        } else if (data.draw) {
          setGameStatus("Game drawn");
        }
      }
      
      // Update possibilities count if provided
      if (data.possibilities) {
        setPossibilities(data.possibilities);
      }
      
      // Update board after AI move
      updateBoardState();
      setIsLoading(false);
    });
    
    socketRef.current.on('ai_move_error', (data) => {
      console.error('AI move error:', data);
      setIsLoading(false);
    });
    
    socketRef.current.on('game_error', (data) => {
      console.error('Game error:', data);
      setIsLoading(false);
    });
    
    socketRef.current.on('game_over', (data) => {
      console.log('Game over:', data);
      setGameOver(true);
      if (data.checkmate) {
        setGameStatus(chessRef.current.turn() === 'w' ? "Black wins by checkmate!" : "White wins by checkmate!");
      } else if (data.stalemate) {
        setGameStatus("Game drawn by stalemate");
      } else if (data.draw) {
        setGameStatus("Game drawn");
      }
      setIsLoading(false);
    });
    
    socketRef.current.on('game_reset', (data) => {
      console.log('Game reset:', data);
      chessRef.current.reset();
      setGameOver(false);
      setGameStatus("");
      setPossibilities(0);
      setMoveHistory([]);
      updateBoardState();
      setIsLoading(false);
    });
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  // Initialize game on component mount
  useEffect(() => {
    createNewGame();
  }, []);
  
  // Create a new game session
  const createNewGame = () => {
    if (socketRef.current) {
      setIsLoading(true);
      socketRef.current.emit('create_game');
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
      // Only allow white moves
      const piece = chessRef.current.get(from);
      if (!piece || piece.color !== 'w' || chessRef.current.turn() !== 'w') {
        console.log("Not your turn or not a white piece");
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
        return false;
      }
      
      if(chessRef.current.inCheck())
        setInCheck(true);
      else
        setInCheck(false);
      
      // Add player move to history
      setMoveHistory(prev => [...prev, {
        san: move.san,
        color: 'w',
        moveNumber: chessRef.current.moveNumber()
      }]);
      
      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      
      // Update board after player's move
      updateBoardState();
      
      // Send move to server via socket
      if (socketRef.current) {
        setIsLoading(true);
        socketRef.current.emit('make_move', {
          game_id: gameId,
          from,
          to,
          promotion : 'q',
          move: `${from}${to}`,
          depth
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error making move:", error);
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
  const resetGame = () => {
    if (socketRef.current && gameId) {
      setIsLoading(true);
      socketRef.current.emit('reset_game', { game_id: gameId });
    } else {
      createNewGame();
    }
  };
  
  // Cancel AI calculation if needed
  const cancelCalculation = () => {
    if (socketRef.current && gameId && isLoading) {
      socketRef.current.emit('cancel_calculation', { game_id: gameId });
    }
  };
  
  return (
    <div className="flex bg-gray-100">
      {/* Moves History */}
      <div className="h-full p-4 flex items-center">
        {/* {JSON.stringify(moveHistory)} */}
        <MoveHistory moveHistory={moveHistory} />
      </div>
      
      {/* Game Board */}
      <div className="flex flex-col items-center justify-center min-w-2/3 min-h-screen bg-gray-100 p-2">
        <h1 className="text-3xl text-black font-bold mb-1">ChessAI</h1>
        
        {gameOver && (
          <div className={`${gameOver ? "visible" : "invisible"}text-xl font-semibold text-red-600 mb-4`}>
            {gameStatus || "Game Over"}
          </div>
        )}

        {inCheck && (
          <div className="text-lg font-semibold text-red-600">
            Check
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
      <div className="bg-gray-100">
        <GameControls
          depth={depth}
          possibilities={possibilities}
          isLoading={isLoading}
          setDepth={setDepth}
          resetGame={resetGame}
          cancelCalculation={cancelCalculation}
        />
      </div>
    </div>
  );
}