// ChessBoard.tsx
import React from 'react';
import { Square as ChessSquare } from 'chess.js';
import { ChessPiece } from './types';
import Square from './Square';

interface ChessBoardProps {
  pieces: ChessPiece[];
  selectedPiece: ChessSquare | null;
  validMoves: ChessSquare[];
  isTurn: boolean;
  isGameOver: boolean;
  handleSquareClick: (square: ChessSquare) => void;
  handleDragStart: (e: React.DragEvent, square: ChessSquare) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, square: ChessSquare) => void;
  handleDragEnd: () => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  pieces,
  selectedPiece,
  validMoves,
  isTurn,
  isGameOver,
  handleSquareClick,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd
}) => {
  const rows: string[] = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const cols: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
  
  // Find piece on a specific square
  const getPieceOnSquare = (square: ChessSquare): ChessPiece | undefined => {
    return pieces.find(p => p.square === square);
  };
  
  return (
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
            {cols.map((col, j) => {
              const square = (col + row) as ChessSquare;
              return (
                <Square
                  key={`square-${col}${row}`}
                  col={col}
                  row={row}
                  isWhiteCell={(i + j) % 2 === 0}
                  square={square}
                  piece={getPieceOnSquare(square)}
                  isSelected={selectedPiece === square}
                  isValidMove={validMoves.includes(square)}
                  isTurn={isTurn}
                  isGameOver={isGameOver}
                  onSquareClick={handleSquareClick}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              );
            })}
            
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
  );
};

export default ChessBoard;