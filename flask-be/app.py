from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import chess
import uuid
import time
from concurrent.futures import ProcessPoolExecutor
import io
from PIL import Image, ImageDraw, ImageFont
import os
import threading

app = Flask(__name__)
CORS(app)

# Store chess games by session ID
game_instances = {}
# Track last activity time for each game
last_activity = {}
# Game expiration time (30 minutes)
EXPIRATION_TIME = 30 * 60

# Piece values for evaluation
PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3, 
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 0
}

# Unicode chess pieces
PIECE_SYMBOLS = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
}

# Directory for saving board images
BOARD_DIR = "board_images"
os.makedirs(BOARD_DIR, exist_ok=True)

def cleanup_expired_games():
    """Periodically remove expired game sessions"""
    while True:
        current_time = time.time()
        expired_games = []
        
        for game_id, last_time in last_activity.items():
            if current_time - last_time > EXPIRATION_TIME:
                expired_games.append(game_id)
        
        for game_id in expired_games:
            if game_id in game_instances:
                del game_instances[game_id]
            if game_id in last_activity:
                del last_activity[game_id]
            print(f"Expired game session {game_id} removed")
        
        time.sleep(60)  # Check every minute

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_expired_games, daemon=True)
cleanup_thread.start()

def evaluate_board(board):
    """Evaluate the current board position"""
    if board.is_checkmate():
        # Return a high value for checkmate, considering whose turn it is
        return -10000 if board.turn == chess.WHITE else 10000
    
    if board.is_stalemate() or board.is_insufficient_material() or board.is_fifty_moves():
        return 0  # Draw
    
    value = 0
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is not None:
            piece_value = PIECE_VALUES[piece.piece_type]
            value += piece_value if piece.color == chess.BLACK else -piece_value
            
            # Add position-based evaluation (center control, development)
            if piece.piece_type == chess.PAWN:
                # Pawns are more valuable as they advance
                rank = chess.square_rank(square)
                rank_value = rank if piece.color == chess.BLACK else 7 - rank
                value += 0.05 * rank_value if piece.color == chess.BLACK else -0.05 * rank_value
            
            # Knights and bishops are more valuable in the center
            if piece.piece_type in (chess.KNIGHT, chess.BISHOP):
                file, rank = chess.square_file(square), chess.square_rank(square)
                center_distance = abs(3.5 - file) + abs(3.5 - rank)
                center_bonus = 0.05 * (4 - center_distance)
                value += center_bonus if piece.color == chess.BLACK else -center_bonus
    
    return value

def minimax(board, depth, alpha, beta, maximizing_player, possibilities):
    """Minimax algorithm with alpha-beta pruning"""
    possibilities += 1
    
    if depth == 0 or board.is_game_over():
        return evaluate_board(board), possibilities
    
    if maximizing_player:  # Black's turn (AI)
        max_eval = float('-inf')
        for move in board.legal_moves:
            board.push(move)
            evaluation, new_possibilities = minimax(board, depth - 1, alpha, beta, False, possibilities)
            possibilities = new_possibilities
            board.pop()
            max_eval = max(max_eval, evaluation)
            alpha = max(alpha, evaluation)
            if beta <= alpha:
                break  # Beta cutoff
        return max_eval, possibilities
    else:  # White's turn (Human)
        min_eval = float('inf')
        for move in board.legal_moves:
            board.push(move)
            evaluation, new_possibilities = minimax(board, depth - 1, alpha, beta, True, possibilities)
            possibilities = new_possibilities
            board.pop()
            min_eval = min(min_eval, evaluation)
            beta = min(beta, evaluation)
            if beta <= alpha:
                break  # Alpha cutoff
        return min_eval, possibilities

def find_best_move(board, depth=3, possibilities=0):
    """Find the best move for the current position"""
    best_move = None
    best_value = float('-inf')
    possibilities += 1
    
    for move in board.legal_moves:
        board.push(move)
        move_value, new_possibilities  = minimax(board, depth - 1, float('-inf'), float('inf'), False, possibilities)
        possibilities = new_possibilities
        board.pop()
        
        if move_value > best_value:
            best_value = move_value
            best_move = move
    
    return best_move, possibilities

def generate_board_image(board):
    """Generate a chess board image from the current position"""
    square_size = 50
    board_size = square_size * 8
    
    # Create board image
    img = Image.new('RGB', (board_size, board_size), 'white')
    draw = ImageDraw.Draw(img)
    
    # Draw squares
    for rank in range(8):
        for file in range(8):
            square_color = '#f0d9b5' if (rank + file) % 2 == 0 else '#b58863'
            x1, y1 = file * square_size, rank * square_size
            x2, y2 = x1 + square_size, y1 + square_size
            draw.rectangle([x1, y1, x2, y2], fill=square_color)
    
    # Try to load a font for the chess pieces
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except IOError:
        font = ImageFont.load_default()
    
    # Draw pieces
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            file, rank = chess.square_file(square), chess.square_rank(square)
            x = file * square_size + square_size // 2
            y = rank * square_size + square_size // 2
            
            symbol = PIECE_SYMBOLS[piece.symbol()]
            draw.text((x, y), symbol, fill='black' if piece.color == chess.BLACK else 'white',
                      font=font, anchor='mm')
    
    # Save to memory
    img_byte_array = io.BytesIO()
    img.save(img_byte_array, format='PNG')
    img_byte_array.seek(0)
    return img_byte_array

@app.route('/game/create', methods=['POST'])
def create_game():
    """Create a new game session"""
    game_id = str(uuid.uuid4())
    game_instances[game_id] = chess.Board()
    last_activity[game_id] = time.time()
    
    return jsonify({
        'game_id': game_id,
        'fen': game_instances[game_id].fen(),
        'turn': 'white',
        'message': 'New game created'
    })

@app.route('/game/move', methods=['POST'])
def make_move():
    """Process a player's move and respond with AI move"""
    data = request.json
    game_id = data.get('game_id')
    print(game_id)
    
    # Validate game_id
    if not game_id or game_id not in game_instances:
        return jsonify({'error': 'Invalid or expired game session'}), 400
    
    # Update last activity time
    last_activity[game_id] = time.time()
    board = game_instances[game_id]
    
    # Check if it's player's turn (white)
    if board.turn != chess.WHITE:
        return jsonify({'error': 'Not your turn, AI is thinking'}), 400
    
    # Process player's move
    try:
        move = chess.Move.from_uci(data['move'])
        if move not in board.legal_moves:
            return jsonify({'error': 'Illegal move'}), 400
        
        board.push(move)
    except (KeyError, ValueError) as e:
        return jsonify({'error': f'Invalid move format: {str(e)}'}), 400
    
    # Check if game is over after player's move
    if board.is_game_over():
        return jsonify({
            'fen': board.fen(),
            'gameOver': True,
            'checkmate': board.is_checkmate(),
            'stalemate': board.is_stalemate(),
            'draw': board.is_insufficient_material() or board.is_stalemate() 
                   or board.is_fifty_moves() or board.is_repetition(),
            'inCheck': board.is_check(),
            'turn': 'black',
            'playerMove': data['move'],
        })
    
    # Calculate AI's move
    depth = data.get('depth', 2)
    best_move, possibilities = find_best_move(board, depth, 0)
    
    if best_move:
        # Convert move to string format
        ai_move_uci = best_move.uci()
        ai_move_san = board.san(best_move)
        
        # Make the AI move
        board.push(best_move)
        
        # Generate response data
        response_data = {
            'fen': board.fen(),
            'gameOver': board.is_game_over(),
            'checkmate': board.is_checkmate(),
            'stalemate': board.is_stalemate(),
            'draw': board.is_insufficient_material() or board.is_stalemate() 
                   or board.is_fifty_moves() or board.is_repetition(),
            'inCheck': board.is_check(),
            'turn': 'white',  # Now it's player's turn again
            'playerMove': data['move'],
            'aiMove': {
                'uci': ai_move_uci,
                'san': ai_move_san
            },
            'possibilities': possibilities
        }
        
        return jsonify(response_data)
    else:
        return jsonify({'error': 'AI could not find a valid move'}), 500

@app.route('/game/board/<game_id>', methods=['GET'])
def get_board_image(game_id):
    """Get the current board state as an image"""
    if game_id not in game_instances:
        return jsonify({'error': 'Invalid or expired game session'}), 400
    
    board = game_instances[game_id]
    img_bytes = generate_board_image(board)
    
    return send_file(img_bytes, mimetype='image/png')

@app.route('/game/status/<game_id>', methods=['GET'])
def get_game_status(game_id):
    """Get the current game status"""
    if game_id not in game_instances:
        return jsonify({'error': 'Invalid or expired game session'}), 400
    
    board = game_instances[game_id]
    last_activity[game_id] = time.time()  # Update last activity time
    
    return jsonify({
        'fen': board.fen(),
        'gameOver': board.is_game_over(),
        'checkmate': board.is_checkmate(),
        'stalemate': board.is_stalemate(),
        'draw': board.is_insufficient_material() or board.is_stalemate() 
               or board.is_fifty_moves() or board.is_repetition(),
        'inCheck': board.is_check(),
        'turn': 'white' if board.turn == chess.WHITE else 'black',
        'pieceCount': {
            'white': len([p for p in board.piece_map().values() if p.color == chess.WHITE]),
            'black': len([p for p in board.piece_map().values() if p.color == chess.BLACK])
        }
    })

@app.route('/game/reset/<game_id>', methods=['POST'])
def reset_game(game_id):
    """Reset the game to initial position"""
    if game_id not in game_instances:
        return jsonify({'error': 'Invalid or expired game session'}), 400
    
    game_instances[game_id].reset()
    last_activity[game_id] = time.time()
    
    return jsonify({
        'fen': game_instances[game_id].fen(),
        'turn': 'white',
        'message': 'Game reset successfully'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4040, threaded=True)