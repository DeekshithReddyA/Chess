// GameControls.tsx
import React from 'react';

interface GameControlsProps {
  depth: number;
  possibilities: number;
  isLoading: boolean;
  setDepth: (value: React.SetStateAction<number>) => void;
  resetGame: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  depth,
  possibilities,
  isLoading,
  setDepth,
  resetGame
}) => {
  return (
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
  );
};

export default GameControls;