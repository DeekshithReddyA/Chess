// MoveHistory.tsx
import React from 'react';
import { MoveHistory as MoveHistoryType } from './types';

interface MoveHistoryProps {
  moveHistory: MoveHistoryType[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moveHistory }) => {
  // Organize the move history into a structured format
  const organizedMoves: Record<number, {white?: string, black?: string}> = {};
  
  // First, organize the moves by move number
  moveHistory.forEach(move => {
    if (!organizedMoves[move.moveNumber]) {
      organizedMoves[move.moveNumber] = {};
    }
    
    if (move.color === 'w') {
      organizedMoves[move.moveNumber].white = move.san;
    } else if (move.color === 'b') {
      organizedMoves[move.moveNumber].black = move.san;
    }
  });
  
  // Convert to array for rendering
  const moveRows = Object.entries(organizedMoves).map(([moveNumber, moves]) => ({
    number: parseInt(moveNumber),
    white: moves.white || '',
    black: moves.black || ''
  }));
  
  // Sort by move number
  moveRows.sort((a, b) => a.number - b.number);
  
  return (
    <div className="w-64 mt-32 h-full bg-white p-4 rounded-lg shadow-lg overflow-y-auto min-h-96 max-h-102">
      <h2 className="text-xl text-black font-bold mb-2 text-center">Move History</h2>
      {moveRows.length === 0 ? (
        <div className="text-gray-500 text-center">No moves yet</div>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-black">
          <div className="font-bold text-center">Move</div>
          <div className="font-bold text-center">White</div>
          <div className="font-bold text-center">Black</div>
          
          {moveRows.map((row) => (
            <React.Fragment key={row.number}>
              <div className="text-center">{row.number}.</div>
              <div className="text-center">{row.white}</div>
              <div className="text-center">{row.black}</div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default MoveHistory;