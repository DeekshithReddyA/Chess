// "use client";
// import { useState, useEffect, useRef, ReactElement } from "react";
// import Image from "next/image";
// import { Chess, Square, Piece } from "chess.js";
// import axios from "axios";

// type PieceCode = "wr" | "wn" | "wb" | "wq" | "wk" | "wp" | "br" | "bn" | "bb" | "bq" | "bk" | "bp";
// type Position = string; // Format: "a1", "h8", etc.


// interface ChessPiece {
//   square: Square;
//   piece: Piece;
// }

// export default function Game(): ReactElement {
//   const rows: string[] = ["8", "7", "6", "5", "4", "3", "2", "1"];
//   const cols: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
  
//   // Chess.js game state
//   const chessRef = useRef<Chess>(new Chess());
//   const audioRef = useRef<HTMLAudioElement>(null);
//   const [possibilites , setPossibilities] = useState<number>(0);
//   const [pieces, setPieces] = useState<ChessPiece[]>([]);
//   const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
//   const [validMoves, setValidMoves] = useState<Square[]>([]);
//   const [draggingPiece, setDraggingPiece] = useState<Square | null>(null);
//   const [gameOver , setGameOver] = useState<boolean>(false);
//   const [depth , setDepth] = useState<number>(1);
  
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
//           newPieces.push({ square : sq , piece });
//         }
//       }
//     }
    
//     setPieces(newPieces);
//   };
  
//   // Convert chess.js piece notation to our piece code
//   const getPieceCode = (piece: Piece): PieceCode => {
//     return `${piece.color}${piece.type}` as PieceCode;
//   };
  
//   // Handle click on a square
//   const handleSquareClick = async (square: Square) => {
//     // If we already have a selected piece, try to move it
//     if (selectedPiece) {
//       // If clicking on a different square, attempt to make a move
//       if (square !== selectedPiece) {
//         try {
//           const move = chessRef.current.move({
//             from: selectedPiece,
//             to: square,
//             promotion: 'q' // Always promote to queen for simplicity
//           });
          
//           if (move) {
//             updateBoardState();
//             if(audioRef.current){
//               audioRef.current.currentTime = 0;
//               audioRef.current.play();
//             }
//             if(move.color === 'w'){
//               const response = await axios.post("http://localhost:4000/game/move" , {fen : chessRef.current.fen(), move, depth});
//               console.log(response.data);
//               setPossibilities(response.data.possibilities);
//               if(response.data.gameOver === "true")
//                 setGameOver(true); 
//               if(response.data.move && !response.data.gameOver){
//                 chessRef.current.move(response.data.move);
//                 updateBoardState();
//               }
//             }
//           }
//         } catch (e) {
//           // Invalid move, do nothing
//           console.log("Invalid move");
//         }
//       }
      
//       // Clear selection either way
//       setSelectedPiece(null);
//       setValidMoves([]);
//       return;
//     }
    
//     // Check if the square has a piece that can be moved
//     const piece = chessRef.current.get(square);
//     if (piece && piece.color === chessRef.current.turn()) {
//       setSelectedPiece(square);
      
//       // Calculate valid moves for this piece
//       const moves = chessRef.current.moves({
//         square: square,
//         verbose: true
//       });
      
//       // Extract destination squares
//       const validSquares = moves.map(move => move.to);
//       setValidMoves(validSquares);
//     }
//   };
  
//   // Start dragging a piece
//   const handleDragStart = (e: React.DragEvent, square: Square) => {
//     handleSquareClick(square);
//     const piece = chessRef.current.get(square);
//     if (piece && piece.color === chessRef.current.turn()) {
//       setDraggingPiece(square);
      
//       // Calculate valid moves
//       const moves = chessRef.current.moves({
//         square: square,
//         verbose: true
//       });
      
//       const validSquares = moves.map(move => move.to);
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
    
//     if (!draggingPiece) return;
    
//     // Check if this is a valid move
//     if (validMoves.includes(targetSquare)) {
//       try {
//         const move = chessRef.current.move({
//           from: draggingPiece,
//           to: targetSquare,
//           promotion: 'q' // Always promote to queen for simplicity
//         });
        
//         if (move) {
//           if(audioRef.current){
//             audioRef.current.currentTime = 0;
//             audioRef.current.play();
//           }
//           updateBoardState();
//           if(move.color === 'w'){
//           const response = await axios.post("http://localhost:4000/game/move" , {fen : chessRef.current.fen(),move, depth}); 
//           console.log(response.data);
//           setPossibilities(response.data.possibilities);
//           if(response.data.gameOver === "true")
//             setGameOver(true);
//           if(response.data.move && !response.data.gameOver){
//             chessRef.current.move(response.data.move);
//             updateBoardState();
//           }
//           }
//         }
//       } catch (e) {
//         // Invalid move
//         console.log("Invalid drag move");
//       }
//     }
    
//     // Reset drag state
//     setDraggingPiece(null);
//     setValidMoves([]);
//   };
  
//   // End dragging without a drop
//   const handleDragEnd = () => {
//     setDraggingPiece(null);
//     setValidMoves([]);
//   };
  
//   // Render a piece image
//   const getPieceImage = (pieceCode: PieceCode, square: Square): ReactElement => {
//     return (
//       <div
//       >
//         <Image 
//           src={`/${pieceCode}.png`} 
//           alt={pieceCode} 
//           width={50} 
//           height={50} 
//           priority={true}
//           draggable={true}
//           onDragStart={(e) => handleDragStart(e, square)}
//           onDragEnd={handleDragEnd}
//           className="cursor-grab active:cursor-grabbing" 
//           />
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

//   return (
//     <>
//     <div className="flex flex-col items-center justify-center">
//       <div onClick={ async (e) => {
//         e.preventDefault();
//         chessRef.current.reset();
//         updateBoardState();
//         const response = await axios.post("http://localhost:4000/game/reset");
        
//       }} className="border border-2 p-2 m-5 cursor-pointer" >Reset</div>
//       {JSON.stringify(gameOver)}
//       {gameOver && <div className="text-xl text-red-500">Game Over</div>}
//       <audio ref={audioRef} src="/move.wav" autoPlay={true}/>
//       <div className="flex flex-col">
//         {/* Column labels - top */}
//         <div className="ml-10 flex space-x-10">
//           {cols.map((col, i) => (
//             <div key={`col-top-${i}`} className="text-center w-6">{col}</div>
//           ))}
//         </div>
        
//         {/* Board rows */}
//         {rows.map((row, i) => (
//           <div key={`row-${i}`} className="flex">
//             {/* Row label - left */}
//             <div className="mt-6 mr-2">{row}</div>
            
//             {/* Chess cells */}
//             {cols.map((col, j) => renderCell(col, row, (i + j) % 2 === 0))}
            
//             {/* Row label - right */}
//             <div className="mt-6 ml-2">{row}</div>
//           </div>
//         ))}
        
//         {/* Column labels - bottom */}
//         <div className="ml-10 flex space-x-10">
//           {cols.map((col, i) => (
//             <div key={`col-bottom-${i}`} className="text-center w-6">{col}</div>
//           ))}
//         </div>
//       </div>
//           <div>
//             Depth of minimax search. Equivalent to number of moves the AI looks ahead
//           </div>
//       <div className="flex">
//         <div className="flex w-10">
//           <div onClick={(e) => {
//             e.preventDefault();
//             setDepth(d => d  - 1);
//           }} className="p-1 bg-white text-black border border-r cursor-pointer">-</div>
//           <div className="p-1 bg-white text-black">{depth}</div>
//           <div onClick={(e) => {
//             e.preventDefault();
//             setDepth(d => d  + 1);
//           }} className="p-1 bg-white text-black border border-l cursor-pointer">+</div>
//         </div>
//       </div>
//       <div className="absolute right-40">
//         <div className="flex items-center justify-center">
//           <div className="">Possibilities: {possibilites}</div>
//           </div>
//       </div>
//       </div>
//     </>
//   );
// }


"use client";
import { useState, useEffect, useRef, ReactElement } from "react";
import Image from "next/image";
import { Chess, Square, Piece } from "chess.js";
import axios from "axios";

type PieceCode = "wr" | "wn" | "wb" | "wq" | "wk" | "wp" | "br" | "bn" | "bb" | "bq" | "bk" | "bp";
type Position = string; // Format: "a1", "h8", etc.

interface ChessPiece {
  square: Square;
  piece: Piece;
}

interface AiMoveResponse {
  fen: string;
  gameOver: boolean;
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
  inCheck: boolean;
  turn: 'w' | 'b';
  move?: {
    from: string;
    to: string;
    san: string;
  };
  possibilities?: number;
  error?: string;
}

export default function Game(): ReactElement {
  const rows: string[] = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const cols: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
  
  // Chess.js game state
  const chessRef = useRef<Chess>(new Chess());
  const audioRef = useRef<HTMLAudioElement>(null);
  const [possibilities, setPossibilities] = useState<number>(0);
  const [pieces, setPieces] = useState<ChessPiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [draggingPiece, setDraggingPiece] = useState<Square | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<string>("");
  const [depth, setDepth] = useState<number>(2);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Initialize board on component mount
  useEffect(() => {
    updateBoardState();
  }, []);
  
  // Update the visual board state from chess.js
  const updateBoardState = () => {
    const newPieces: ChessPiece[] = [];
    
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
  
  // Convert chess.js piece notation to our piece code
  const getPieceCode = (piece: Piece): PieceCode => {
    return `${piece.color}${piece.type}` as PieceCode;
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
      
      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      
      // Update board after player's move
      updateBoardState();
      
      // Send move to server and get AI response
      const response = await axios.post<AiMoveResponse>(
        "http://localhost:4000/game/move", 
        {
          fen: chessRef.current.fen(),
          move: `${from}${to}`,
          depth
        }
      );
      
      console.log("Server response:", response.data);
      
      // Update possibilities count
      if (response.data.possibilities) {
        setPossibilities(response.data.possibilities);
      }
      
      // Check game state
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
      
      // Make AI move if provided
      if (response.data.move && !response.data.gameOver) {
        // Update local board with AI move
        chessRef.current.load(response.data.fen);
        
        // Play sound for AI move
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
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
      chessRef.current.reset();
      
      const response = await axios.post("http://localhost:4000/game/reset");
      
      setGameOver(false);
      setGameStatus("");
      setPossibilities(0);
      updateBoardState();
      setIsLoading(false);
    } catch (error) {
      console.error("Error resetting game:", error);
      setIsLoading(false);
    }
  };
  
  // Render a piece image
  const getPieceImage = (pieceCode: PieceCode, square: Square): ReactElement => {
    const isPlayerPiece = pieceCode.startsWith('w') && chessRef.current.turn() === 'w' && !gameOver;
    
    return (
      <div>
        <Image 
          src={`/${pieceCode}.png`} 
          alt={pieceCode} 
          width={50} 
          height={50} 
          priority={true}
          draggable={isPlayerPiece}
          onDragStart={(e) => isPlayerPiece ? handleDragStart(e, square) : undefined}
          onDragEnd={handleDragEnd}
          className={isPlayerPiece ? "cursor-grab active:cursor-grabbing" : "cursor-default"} 
        />
      </div>
    );
  };
  
  // Check if a square has a piece
  const getPieceOnSquare = (square: Square): ChessPiece | undefined => {
    return pieces.find(p => p.square === square);
  };
  
  // Render a single cell
  const renderCell = (col: string, row: string, isWhiteCell: boolean): ReactElement => {
    const square = col + row as Square;
    const pieceData = getPieceOnSquare(square);
    const isSelected = selectedPiece === square;
    const isValidMove = validMoves.includes(square);
    
    let bgColor = isWhiteCell ? "bg-white" : "bg-green-500";
    
    if (isSelected) {
      bgColor = "bg-yellow-200";
    }
    
    return (
      <div 
        key={square} 
        className={`w-16 h-16 border border-1 ${bgColor} flex items-center justify-center relative`}
        onClick={() => handleSquareClick(square)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, square)}
      >
        {pieceData && getPieceImage(getPieceCode(pieceData.piece), square)}
        
        {/* Valid move indicator */}
        {isValidMove && !pieceData && (
          <div className="absolute w-6 h-6 rounded-full bg-gray-500 opacity-50"></div>
        )}
        
        {/* Valid capture indicator */}
        {isValidMove && pieceData && (
          <div className="absolute inset-1 border border-5 border-gray-500/50 rounded-full" style={{zIndex: 10}}></div>
        )}
      </div>
    );
  };

  return (
    <div className="flex">
    <div className="flex flex-col items-center justify-center min-w-2/3 min-h-screen bg-gray-100 p-2">
      <h1 className="text-3xl text-black font-bold mb-1">Chess Game</h1>
      
      {gameOver && (
        <div className="text-xl font-semibold text-red-600 mb-4">
          {gameStatus || "Game Over"}
        </div>
      )}
      
        <div className={`text-lg ${isLoading? "text-blue-600" : "text-gray-100"} mb-4`}>
          AI is thinking...
        </div>
      
      <audio ref={audioRef} src="/move.wav" />
      
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex flex-col">
          {/* Column labels - top */}
          <div className="ml-10 flex space-x-10">
            {cols.map((col, i) => (
              <div key={`col-top-${i}`} className="text-center w-6 text-black">{col}</div>
            ))}
          </div>
          
          {/* Board rows */}
          {rows.map((row, i) => (
            <div key={`row-${i}`} className="flex">
              {/* Row label - left */}
              <div className="mt-6 mr-2 text-black">{row}</div>
              
              {/* Chess cells */}
              {cols.map((col, j) => renderCell(col, row, (i + j) % 2 === 0))}
              
              {/* Row label - right */}
              <div className="mt-6 ml-2 text-black">{row}</div>
            </div>
          ))}
          
          {/* Column labels - bottom */}
          <div className="ml-10 flex space-x-10">
            {cols.map((col, i) => (
              <div key={`col-bottom-${i}`} className="text-center w-6 text-black">{col}</div>
            ))}
          </div>
        </div>
      </div>
      

    </div>
        <div className="bg-gray-100">
          <div className="flex flex-col items-center justify-center min-h-screen p-2 mr-10">
      <div className="m-2 text-black">
        <div className="text-center mb-1">
          AI Difficulty: Depth of minimax search (# of moves the AI looks ahead)
        </div>
        <div className="flex justify-center items-center">
          <button 
            onClick={() => setDepth(d => Math.max(1, d - 1))}
            className="px-3 py-1 bg-gray-300 rounded-l"
            disabled={depth <= 1}
            >
            -
          </button>
          <div className="px-4 py-1 bg-white border-t border-b">{depth}</div>
          <button 
            onClick={() => setDepth(d => Math.min(5, d + 1))}
            className="px-3 py-1 bg-gray-300 rounded-r"
            disabled={depth >= 6}
            >
            +
          </button>
        </div>
      </div>
      <div className="mb-4">
        <div className="text-lg text-black">
          Possibilities analyzed: {possibilities}
        </div>
      </div>
      <div className="mb-4">
        <button 
          onClick={resetGame} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={isLoading}
          >
          Reset Game
        </button>
      </div>
    </div>
              </div>
    </div>
  );
}