import bz2
import numpy as np
import pandas as pd
import math

with bz2.open("finetuning/archive/lichess_db_standard_rated_2014-10.pgn.bz2", "rb") as f:
    data = f.read()

data = str(data) # Convert binary data into string for easier functionality
raw_games = data.split('[Event') # Split the data into chess games using the '[Event' string
print("Game at 0th index: %s" % raw_games[0])
del raw_games[0] # The first index isn't a game
del data # Remove binary string to save memory

all_games = []
for i in range(len(raw_games)):
    if raw_games[i].find('eval') != -1 or raw_games[i].find('1.') == -1:
        continue
    else:
        all_games.append(raw_games[i])

del raw_games 

PGN_list = []
mode_list = []
result_list = []
avg_rating_list = []
rating_diff_list = []
termination_list = []
for game in all_games:
    # PGN
    index = game.find("1. ") + 2
    while True:
        if game[index:index+2] == '0-' or game[index:index+2] == '1-' or game[index:index+2] == '1/':
            # Game termination
            break
        index += 1
    
    PGN_list.append(game[game.find("1."):index-1])
    
    # Mode
    index = game.find("d") + 2
    s = ""
    while True:
        if game[index] == " ":
            break
        s += game[index]
        index += 1
    mode_list.append(s)
    
    # Result
    index = game.find('Result')+8
    result = game[index:index+2]
    if result == "1-":
        result_list.append("White Wins")
    elif result == "0-":
        result_list.append("Black Wins")
    elif result == "1/":
        result_list.append("Draw")
    
    # Rating
    wIndex = game.find('WhiteElo') + 10
    bIndex = game.find('BlackElo') + 10
    wString = ""
    while True:
        # Use a loop in case there's a rating <1000
        if game[wIndex] == '"':
            break
        wString += game[wIndex]
        wIndex += 1
    
    bString = ""
    while True:
        if game[bIndex] == '"':
            break
        bString += game[bIndex]
        bIndex += 1
        
    wRating = int(wString)
    bRating = int(bString)
    avg_rating_list.append(math.ceil((wRating+bRating)/2))
    rating_diff_list.append(wRating-bRating)
    
    # Termination
    index = game.find("[Termination")
    quotes = 0
    s = ""
    while quotes < 2:
        if game[index] == '"':
            quotes += 1
        elif quotes == 1:
            s += game[index]
        index += 1
    
    termination_list.append(s)


chess_df = pd.DataFrame({})
chess_df['PGN'] = PGN_list
chess_df['Mode'] = mode_list
chess_df['Result'] = result_list
chess_df['Average Rating'] = avg_rating_list
chess_df['Rating Difference'] = rating_diff_list
chess_df['Termination Type'] = termination_list

print("Dataset is %.2f MB" % (chess_df.memory_usage(deep=True).sum()/1000000))
print("Original array length: %d\nNew dataframe length: %d" % (len(all_games), len(chess_df)))

chess_df.to_csv('finetuning/data/chess_games3.csv', index=True, header=True)