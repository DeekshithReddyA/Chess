// types.ts
import { Square, Piece } from "chess.js";

export type PieceCode = "wr" | "wn" | "wb" | "wq" | "wk" | "wp" | "br" | "bn" | "bb" | "bq" | "bk" | "bp";
export type Position = string; // Format: "a1", "h8", etc.

export interface ChessPiece {
  square: Square;
  piece: Piece;
}

export interface MoveHistory {
  san: string;
  color: 'w' | 'b';
  moveNumber: number;
}

export interface AIMove {
  uci: string;
  san: string;
}

export interface GameResponse {
  fen: string;
  gameOver: boolean;
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
  inCheck: boolean;
  turn: string;
  playerMove?: string;
  aiMove?: AIMove;
  error?: string;
  possibilities?: string;
}



// Socket.IO event types
export interface GameCreatedEvent {
  game_id: string;
  fen: string;
  turn: string;
  message: string;
}

export interface MoveAcceptedEvent {
  fen: string;
  playerMove: string;
}

export interface AIThinkingEvent {
  message: string;
  depth: number;
}

export interface SearchProgressEvent {
  positions_analyzed: number;
  depth: number;
}

export interface AIMoveResultEvent {
  fen: string;
  gameOver: boolean;
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
  inCheck: boolean;
  turn: string;
  aiMove: AIMove;
  possibilities: number;
}

export interface GameErrorEvent {
  error: string;
}