"use client";
import Image from "next/image";
import { ReactElement } from "react";

type PieceCode = "wr" | "wn" | "wb" | "wq" | "wk" | "wp" | "br" | "bn" | "bb" | "bq" | "bk" | "bp";
type Position = string; // Format: "a1", "h8", etc.

interface BoardSetup {
  [position: Position]: PieceCode;
}

export default function Game(): ReactElement {
  const rows: string[] = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const cols: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
  
  // Optimized piece mappings with complete initial chess setup
  const initialSetup: BoardSetup = {
    // White pieces
    a1: "wr", b1: "wn", c1: "wb", d1: "wq", e1: "wk", f1: "wb", g1: "wn", h1: "wr",
    a2: "wp", b2: "wp", c2: "wp", d2: "wp", e2: "wp", f2: "wp", g2: "wp", h2: "wp",
    
    // Black pieces
    a8: "br", b8: "bn", c8: "bb", d8: "bq", e8: "bk", f8: "bb", g8: "bn", h8: "br",
    a7: "bp", b7: "bp", c7: "bp", d7: "bp", e7: "bp", f7: "bp", g7: "bp", h7: "bp",
  };

  // Function to get piece image based on piece code
  const getPieceImage = (pieceCode: PieceCode): ReactElement | null => {
    if (!pieceCode) return null;
    
    try {
      // Dynamically import the correct image based on piece code
      return <Image 
        src={`/${pieceCode}.png`} 
        alt={pieceCode} 
        width={50} 
        height={50} 
        priority={true}
        draggable={false} 
      />;
    } catch (error) {
      console.error(`Failed to load image for piece ${pieceCode}`, error);
      return null;
    }
  };

  // Render a single cell
  const renderCell = (col: string, row: string, isWhiteCell: boolean): ReactElement => {
    const position = col + row as Position;
    const pieceCode = initialSetup[position];
    const bgColor = isWhiteCell ? "bg-white" : "bg-green-500";
    
    return (
      <div 
        key={position} 
        className={`w-15 h-15 border border-1 ${bgColor} flex items-center justify-center`}
      >
        {pieceCode && getPieceImage(pieceCode)}
      </div>
    );
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col">
        {/* Column labels - top */}
        <div className="ml-6 flex space-x-14">
          {cols.map((col, i) => (
            <div key={`col-top-${i}`}>{col}</div>
          ))}
        </div>
        
        {/* Board rows */}
        {rows.map((row, i) => (
          <div key={`row-${i}`} className="flex">
            {/* Row label - left */}
            <div className="mt-4 mr-2">{row}</div>
            
            {/* Chess cells */}
            {cols.map((col, j) => renderCell(col, row, (i + j) % 2 === 0))}
            
            {/* Row label - right */}
            <div className="mt-4 ml-2">{row}</div>
          </div>
        ))}
        
        {/* Column labels - bottom */}
        <div className="ml-6 flex space-x-14">
          {cols.map((col, i) => (
            <div key={`col-bottom-${i}`}>{col}</div>
          ))}
        </div>
      </div>
    </div>
  );
}