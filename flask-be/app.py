from flask import Flask, request, jsonify, send_file
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
import chess
import uuid
import time
import io
from PIL import Image, ImageDraw, ImageFont
import os
import threading
import eventlet

# Use eventlet for WebSocket support
eventlet.monkey_patch()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
CORS(app)


# Store chess games by session ID
game_instances = {}
# Track last activity time for each game
last_activity = {}
# Game expiration time (30 minutes)
EXPIRATION_TIME = 15 * 60
# Track possibilities 
game_possibilities = {}
# Track active computations
active_computations = {}

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
            if game_id in game_possibilities:
                del game_possibilities[game_id]
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

def minimax(board, depth, alpha, beta, maximizing_player, game_id):
    """Minimax algorithm with alpha-beta pruning"""
    if depth == 0 or board.is_game_over():
        return evaluate_board(board)
    
    if maximizing_player:  # Black's turn (AI)
        max_eval = float('-inf')
        for move in board.legal_moves:
            if active_computations[game_id] == False:
                break
            board.push(move)
            game_possibilities[game_id] += 1
            # Send progress update every 1000 positions analyzed
            if game_possibilities[game_id] % 1000 == 0:
                socketio.emit('search_progress', {
                    'positions_analyzed': game_possibilities[game_id],
                    'depth': depth
                }, room=game_id)
                # Allow eventlet to switch to other tasks
                eventlet.sleep(0)
            
            evaluation = minimax(board, depth - 1, alpha, beta, False, game_id)
            board.pop()
            max_eval = max(max_eval, evaluation)
            alpha = max(alpha, evaluation)
            if beta <= alpha:
                break  # Beta cutoff
        return max_eval
    else:  # White's turn (Human)
        min_eval = float('inf')
        for move in board.legal_moves:
            board.push(move)
            game_possibilities[game_id] += 1
            # Send progress update every 1000 positions analyzed
            if game_possibilities[game_id] % 1000 == 0:
                socketio.emit('search_progress', {
                    'positions_analyzed': game_possibilities[game_id],
                    'depth': depth
                }, room=game_id)
                # Allow eventlet to switch to other tasks
                eventlet.sleep(0)
                
            evaluation = minimax(board, depth - 1, alpha, beta, True, game_id)
            board.pop()
            min_eval = min(min_eval, evaluation)
            beta = min(beta, evaluation)
            if beta <= alpha:
                break  # Alpha cutoff
        return min_eval

def compute_ai_move(board, depth, game_id):
    """Find the best move for the current position and emit result via WebSocket"""
    try:
        active_computations[game_id] = True
        game_possibilities[game_id] = 0
        best_move = None
        best_value = float('-inf')
        
        # Emit start of computation
        socketio.emit('ai_thinking', {
            'message': f'AI is thinking at depth {depth}...',
            'depth': depth
        }, room=game_id)
        
        for move in board.legal_moves:
            board.push(move)
            game_possibilities[game_id] += 1
            move_value = minimax(board, depth - 1, float('-inf'), float('inf'), False, game_id)
            board.pop()
            
            if move_value > best_value:
                best_value = move_value
                best_move = move
        
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
                'aiMove': {
                    'uci': ai_move_uci,
                    'san': ai_move_san
                },
                'possibilities': game_possibilities[game_id]
            }
            
            # Emit the result
            socketio.emit('ai_move_result', response_data, room=game_id)
        else:
            socketio.emit('ai_move_error', {
                'error': 'AI could not find a valid move'
            }, room=game_id)
            
    except Exception as e:
        socketio.emit('ai_move_error', {
            'error': f'Error computing move: {str(e)}'
        }, room=game_id)
    finally:
        if game_id in active_computations:
            del active_computations[game_id]

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
        font = ImageFont.truetype("DejaVuSans.ttf", 36)  # DejaVu Sans has chess symbols
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

@app.route('/board/<game_id>', methods=['GET'])
def get_board_image(game_id):
    """Get the current board state as an image"""
    if game_id not in game_instances:
        return jsonify({'error': 'Invalid or expired game session'}), 400
    
    board = game_instances[game_id]
    img_bytes = generate_board_image(board)
    
    return send_file(img_bytes, mimetype='image/png')

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('connected', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")

@socketio.on('create_game')
def handle_create_game():
    """Create a new game session"""
    game_id = str(uuid.uuid4())
    game_instances[game_id] = chess.Board()
    game_possibilities[game_id] = 0
    last_activity[game_id] = time.time()
    
    # Join the client to a room with the game_id
    join_room(game_id)
    
    emit('game_created', {
        'game_id': game_id,
        'fen': game_instances[game_id].fen(),
        'turn': 'white',
        'message': 'New game created'
    })

@socketio.on('join_game')
def handle_join_game(data):
    """Join an existing game session"""
    game_id = data.get('game_id')
    
    if not game_id or game_id not in game_instances:
        emit('game_error', {'error': 'Invalid or expired game session'})
        return
    
    # Join the client to a room with the game_id
    join_room(game_id)
    
    # Update last activity time
    last_activity[game_id] = time.time()
    board = game_instances[game_id]
    
    emit('game_joined', {
        'game_id': game_id,
        'fen': board.fen(),
        'turn': 'white' if board.turn == chess.WHITE else 'black',
        'gameOver': board.is_game_over(),
        'message': 'Joined existing game'
    })

@socketio.on('make_move')
def handle_make_move(data):
    """Process a player's move"""
    game_id = data.get('game_id')
    move_uci = data.get('move')
    from_move = data.get('from')
    to_move = data.get('to')
    promotion = data.get('promotion')
    depth = int(data.get('depth', 3))
    
    # Validate game_id
    if not game_id or game_id not in game_instances:
        emit('game_error', {'error': 'Invalid or expired game session'})
        return
    
    # Update last activity time
    last_activity[game_id] = time.time()
    board = game_instances[game_id]
    
    # Check if it's player's turn (white)
    if board.turn != chess.WHITE:
        emit('game_error', {'error': 'Not your turn, AI is thinking'})
        return
    
    # Check if computation already in progress
    if game_id in active_computations and active_computations[game_id]:
        emit('game_error', {'error': 'AI is already computing a move'})
        return
    
    # Process player's move
    try:

        from_square = chess.parse_square(from_move)
        to_square = chess.parse_square(to_move)
        
        # Detect if this is a pawn promotion move
        is_promotion_move = False
        piece = board.piece_at(from_square)
        
        # Check if it's a pawn moving to the last rank
        if piece and piece.piece_type == chess.PAWN:
            if (piece.color == chess.WHITE and chess.square_rank(to_square) == 7) or \
               (piece.color == chess.BLACK and chess.square_rank(to_square) == 0):
                is_promotion_move = True
        
        # Set promotion piece - default to queen if not specified but needed
        promotion_piece = None
        if is_promotion_move:
            if promotion:
                promotion_map = {'q': chess.QUEEN, 'r': chess.ROOK, 'b': chess.BISHOP, 'n': chess.KNIGHT}
                promotion_piece = promotion_map.get(promotion.lower(), chess.QUEEN)
            else:
                # Default to queen if promotion is required but not specified
                promotion_piece = chess.QUEEN
        
        # Create the move
        move = chess.Move(from_square=from_square, to_square=to_square, promotion=promotion_piece)
        
        if move not in board.legal_moves:
            # Try to find a legal move with the same from/to squares but different promotion
            legal_move_found = False
            for legal_move in board.legal_moves:
                if legal_move.from_square == from_square and legal_move.to_square == to_square:
                    move = legal_move  # Use this legal move instead
                    legal_move_found = True
                    break
            
            if not legal_move_found:
                emit('game_error', {'error': 'Illegal move'})
                return
        
        board.push(move)
        
        # Emit move acknowledgment
        emit('move_accepted', {
            'fen': board.fen(),
            'playerMove': move_uci,
        })
        
        # Check if game is over after player's move
        if board.is_game_over():
            emit('game_over', {
                'fen': board.fen(),
                'gameOver': True,
                'checkmate': board.is_checkmate(),
                'stalemate': board.is_stalemate(),
                'draw': board.is_insufficient_material() or board.is_stalemate() 
                       or board.is_fifty_moves() or board.is_repetition(),
                'inCheck': board.is_check(),
                'turn': 'black',
                'playerMove': move_uci,
            })
            return
        
        # Start AI computation in a separate thread
        ai_thread = threading.Thread(
            target=compute_ai_move,
            args=(board, depth, game_id)
        )
        ai_thread.daemon = True
        ai_thread.start()
        
    except (KeyError, ValueError) as e:
        emit('game_error', {'error': f'Invalid move format: {str(e)}'})

@socketio.on('reset_game')
def handle_reset_game(data):
    """Reset the game to initial position"""
    game_id = data.get('game_id')
    
    if not game_id or game_id not in game_instances:
        emit('game_error', {'error': 'Invalid or expired game session'})
        return
    
    game_instances[game_id].reset()
    game_possibilities[game_id] = 0
    last_activity[game_id] = time.time()
    
    emit('game_reset', {
        'game_id': game_id,
        'fen': game_instances[game_id].fen(),
        'turn': 'white',
        'message': 'Game reset successfully'
    }, room=game_id)

@socketio.on('get_game_status')
def handle_get_game_status(data):
    """Get current game status"""
    game_id = data.get('game_id')
    
    if not game_id or game_id not in game_instances:
        emit('game_error', {'error': 'Invalid or expired game session'})
        return
    
    board = game_instances[game_id]
    last_activity[game_id] = time.time()
    
    emit('game_status', {
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

@socketio.on('cancel_calculation')
def handle_cancel_calculation(data):
    """Cancel an ongoing AI calculation"""
    game_id = data.get('game_id')
    
    if not game_id or game_id not in game_instances:
        emit('game_error', {'error': 'Invalid or expired game session'})
        return
    
    if game_id in active_computations:
        # Mark computation as canceled
        active_computations[game_id] = False
        emit('calculation_canceled', {
            'message': 'AI calculation canceled'
        }, room=game_id)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=4040, debug=True)