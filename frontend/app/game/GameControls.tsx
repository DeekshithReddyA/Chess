// GameControls.tsx
import React from 'react';

interface GameControlsProps {
  depth: number;
  possibilities: number;
  isLoading: boolean;
  setDepth: (value: React.SetStateAction<number>) => void;
  resetGame: () => void;
  cancelCalculation: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  depth,
  possibilities,
  isLoading,
  setDepth,
  resetGame,
  cancelCalculation
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
            className="px-3 cursor-pointer py-1 bg-gray-300 rounded-l"
            disabled={depth <= 1}
          >
            -
          </button>
          <div className="px-4 py-1 bg-white border-t border-b">{depth}</div>
          <button 
            onClick={() => setDepth(d => Math.min(5, d + 1))}
            className="px-3 cursor-pointer py-1 bg-gray-300 rounded-r"
            disabled={depth >= 5}
          >
            +
          </button>
        </div>
      </div>
      <div className="mb-4">
        <div className="text-lg text-black">
          Possibilities analyzed: {possibilities.toLocaleString()}
        </div>
      </div>
      <div className="mb-4">
        <button 
          onClick={resetGame} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
          disabled={isLoading}
        >
          Reset Game
        </button>
        {isLoading && (
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none cursor-pointer focus:ring-2 focus:ring-red-500"
            onClick={cancelCalculation}
          >
            Cancel AI Thinking
          </button>
        )}
      </div>
    </div>
  );
};

export default GameControls;