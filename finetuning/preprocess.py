import pandas as pd
import chess.pgn
import io

# read data
df = pd.read_csv('finetuning/data/chess_games.csv')
# Read the game
game = chess.pgn.read_game(io.StringIO(pgn))

# Get the board

def process_pgn(game):
    board = game.board()
    for count, move in enumerate(game.mainline_moves(), start=1):
        print(f"Move {count // 2 + count % 2} {'White' if (count % 2 == 1) else 'Black'}: {chess.square_name(move.from_square)} to {chess.square_name(move.to_square)}")
        board.push(move)

def gen_fen(game):
    board = game.board()
    for count, move in enumerate(game.mainline_moves(), start=1):
        board.push(move)
    return board.fen()

print (df['Average Rating'][0])
process_pgn(df['PGN'][0])
print(df['Result'][0])

# Training data will look like this

def generateAnalyse(elo, pgn, fen):
    tmp = "As a seasoned chess tutor with an ELO rating of {elo}, it's my job to provide a detailed breakdown of the current state of this chess game."
    tmp+= "I'll carefully analyze the positions of the pieces, evaluate potential threats, and identify any tactical opportunities." 
    tmp +=   "My breakdown will offer valuable insights into the strategic aspects of the game, helping both players understand the dynamics on the chessboard." 
    tmp+= "The current PGN is {pgn}."
    tmp+= "Then current FEN is {fen}."
    tmp += "Please don't give any advice on the next move. "
    tmp += "Just evaluate the current state of the game and what observations you can make. "
    tmp += "Be as objective as possible. If you think one player has an advantage, explain why."
    tmp += "If you cannot determine who has the advantage, explain why."
    tmp += "If you cannot make a descion, then dont make one."

    return tmp.format(elo=elo, pgn=pgn, fen=fen)