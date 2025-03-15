// Square.tsx
import React from 'react';
import Image from 'next/image';
import { Square } from 'chess.js';
import { ChessPiece, PieceCode } from './types';

interface SquareProps {
  col: string;
  row: string;
  isWhiteCell: boolean;
  square: Square;
  piece?: ChessPiece;
  isSelected: boolean;
  isValidMove: boolean;
  isTurn: boolean;
  isGameOver: boolean;
  onSquareClick: (square: Square) => void;
  onDragStart: (e: React.DragEvent, square: Square) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, square: Square) => void;
  onDragEnd: () => void;
}

const ChessSquare: React.FC<SquareProps> = ({
  col,
  row,
  isWhiteCell,
  square,
  piece,
  isSelected,
  isValidMove,
  isTurn,
  isGameOver,
  onSquareClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) => {
  // Get piece code for image
  const getPieceCode = (piece: ChessPiece): PieceCode => {
    return `${piece.piece.color}${piece.piece.type}` as PieceCode;
  };
  
  // Determine background color
  let bgColor = isWhiteCell ? "bg-white" : "bg-green-500";
  
  if (isSelected) {
    bgColor = "bg-yellow-200";
  }
  
  // Determine if the piece is draggable (player's turn & white piece)
  const isPlayerPiece = piece && piece.piece.color === 'w' && isTurn && !isGameOver;
  
  return (
    <div 
      className={`w-16 h-16 border border-1 ${bgColor} flex items-center justify-center relative`}
      onClick={() => onSquareClick(square)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, square)}
    >
      {/* Render piece if exists */}
      {piece && (
        <div>
          <Image 
            src={`/${getPieceCode(piece)}.png`} 
            alt={getPieceCode(piece)} 
            width={50} 
            height={50} 
            priority={true}
            draggable={!!isPlayerPiece}
            onDragStart={(e) => isPlayerPiece ? onDragStart(e, square) : undefined}
            onDragEnd={onDragEnd}
            className={isPlayerPiece ? "cursor-grab active:cursor-grabbing" : "cursor-default"} 
          />
        </div>
      )}
      
      {/* Valid move indicator (empty square) */}
      {isValidMove && !piece && (
        <div className="absolute w-6 h-6 rounded-full bg-gray-500 opacity-50"></div>
      )}
      
      {/* Valid capture indicator (occupied square) */}
      {isValidMove && piece && (
        <div className="absolute inset-1 border border-5 border-gray-500/50 rounded-full" style={{zIndex: 10}}></div>
      )}
    </div>
  );
};

export default ChessSquare;