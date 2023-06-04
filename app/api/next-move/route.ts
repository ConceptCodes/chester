import { NextRequest, NextResponse } from "next/server"
import type { Move } from "@/store/useStore"
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  OutputFixingParser,
  StructuredOutputParser,
} from "langchain/output_parsers"
import { ConversationChain } from "langchain/chains";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder
} from "langchain/prompts";
import { PromptTemplate } from "langchain/prompts";
import { z } from "zod"
// import * as stockfish from "stockfish"

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPEN_AI_API_KEY as string,
  modelName: "gpt-3.5-turbo",
  temperature: 0,
  maxTokens: 2000,
})

// TODO: make the actions more modular
// TODO: add a review step to prevent hallunication
// TODO: add more action types (attack, defense, etc.)

const chessParser = StructuredOutputParser.fromZodSchema(
  z.object({
    explanation: z.string().describe("The explanation for the move, be as descriptive as possible talk from the first perspective"),
    winProbability: z
      .number()
      .describe("The probability of winning after the move, 0 is okay if no win probability is given"),
    to: z.string().describe("The square to move the piece to, an empty string if no square is given"),
    from: z.string().describe("The square to move the piece from, an empty string if no square is given"),
  })
)

type ChessParserResponseType = z.infer<typeof chessParser.schema>

type RequestTypes = "/breakdown" | "/next-move" | "/mind-reader" | "/opponent"

const outputFixingParser = OutputFixingParser.fromLLM(model, chessParser)


// const engine = stockfish();

// const getBestMove = (fen: string, rating: string) => {
//   return new Promise((resolve, reject) => {
//     engine.postMessage("uci");
//     engine.postMessage("ucinewgame");
//     engine.postMessage(`position fen ${fen}`);
//     engine.postMessage(`go movetime ${rating}`);
//     engine.onmessage = (event) => {
//       const match = event.data.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
//       if (match) {
//         resolve(match[0]);
//       }
//     };
//   });
// };

export async function playChess(
  board: { fen: string; pgn: string },
  elo: string,
  action: RequestTypes,
  validMoves: Move[]
): Promise<ChessParserResponseType> {
  const format = chessParser.getFormatInstructions()

  // const bestMove = await getBestMove(board.fen, elo);

  let actionTemplate = ""

  switch (action) {
    case "/breakdown":
      actionTemplate = `
        As a seasoned chess tutor with an ELO rating of {elo}, it's my job to provide a detailed breakdown of the current state of this chess game. 
        I'll carefully analyze the positions of the pieces, evaluate potential threats, and identify any tactical opportunities. 
        My breakdown will offer valuable insights into the strategic aspects of the game, helping both players understand the dynamics on the chessboard. 
        The current PGN is {pgn}.
        Then current FEN is {fen}.
        Please don't give any advice on the next move. 
        Just evaluate the current state of the game and what observations you can make. 
        Be as objective as possible. If you think one player has an advantage, explain why.
        If you cannot determine who has the advantage, explain why.
        If you cannot make a descion, then dont make one.
      `
      break
    case "/next-move":
      actionTemplate = `
      You are a seasoned chess coach with an ELO rating of {elo}. 
      Your student is currently engaged in a challenging game and it's their turn to make a move. 
      They are playing as white. We need your expertise to guide them through their next move. 
      Here are the game details:
      - Current PGN: {pgn}
      - Current FEN: {fen}
      - Valid moves: {validMoves}
      As their coach, your job is to evaluate the current board situation and confirm the best move. 
      This move has been calculated using an advanced chess engine, but the engine doesn't explain its reasoning. 
      It's your job to make it understandable to the student.
      Consider the positions, potential threats, opportunities, and the overall state of the game to justify why this is indeed the best move.
      This explanation is crucial as it will help your student understand the nuances of strategic decision-making in chess.
      In your explanation, ensure to mention the specific pieces involved in the move and their positions. 
      Be as specific and detailed as possible, as it will aid your student's understanding of the dynamics of the game.
      Remember, even if the situation appears dire and a win seems improbable, your task is to justify why this move is the most optimal given the circumstances. 
      Your insight and guidance will be instrumental in helping your student navigate through this game and improve their chess skills.
      
      `
      break
    case "/mind-reader":
      actionTemplate = `
      As a chess prodigy with an ELO rating of {elo}, imagine yourself playing as black. Your task is to visualize the chessboard, evaluate the current position, consider potential moves, and decide on the best course of action.
      Here are the game details:
      - Current PGN: {pgn}
      - Current FEN: {fen}
      - Valid moves: {validMoves}
      You'll need to analyze the board and select what you consider to be the best move. 
      While doing this, anticipate the likely response from your opponent, enabling you to plan your second move. 
      Then, thinking several steps ahead, adapt your strategy for the third move based on the likely state of the board.
      Each move you select should be justified over others, and its reasoning explained. This will offer insights into your strategic thought process. 
      Remember, your objective is not just to respond to your opponent's moves, but to control the flow of the game by anticipating their actions and preparing your responses accordingly.
      Even if the situation appears challenging, continue to make the best possible moves and explain your thought process. 
      This insight into your strategy will be instrumental for anyone seeking to understand high-level chess play.
      `
      break
    case "/opponent":
      actionTemplate = `As a chess prodigy with an ELO rating of {elo}, my task is to find the best move for the black player. 
        The move must be a valid move given the current state of the board.
        The current PGN is {pgn}.
        Then current FEN is {fen}.
        And here are the valid moves: {validMoves}.
        After determining the best move, I'll provide a detailed explanation of my thought process. 
        I'll explain why I chose this move, what I expect to gain from it, and I'll also give my estimate of the win probability after this move.
        Even if you think you can't win, still pick a valid move, and explain why you think it's the best move.
        `
      break
    default:
      actionTemplate = `
        As a seasoned tutor with an ELO rating of {elo}, my task is to answer the following question based on the current state of the chessboard:
        The current PGN is {pgn}.
        Then current FEN is {fen}.
        Q: {question}
        If i cannot answer the question, then I will say I cannot answer the question and suggest a command for the user to ask. 
        Here are the list of commands and their breakdowns:
        /breakdown: I'll carefully analyze the positions of the pieces, evaluate potential threats, and identify any tactical opportunities.
        /next-move: I'll scrutinize the present situation on the board and devise the most advantageous next move for your student.
        /mind-reader: I'll evaluate the current position, consider potential moves, and decide on the best actions.
      `
      break
  }

  actionTemplate += `Please make sure that your response is in line with these guidelines: {formatInstruction}.`

  const actionTemplatePrompt = new PromptTemplate({
    template: actionTemplate,
    inputVariables: ["elo", "pgn", "fen"],
    partialVariables: {
      validMoves: JSON.stringify(validMoves), 
      formatInstruction: format,
      question: action
    },
    outputParser: outputFixingParser
  })

  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "You are a helpful chess tutor that helps analyze the board and coach your student on the wonderful game of chess."
    ),
    new HumanMessagePromptTemplate(actionTemplatePrompt),
  ]);

  const chain = new ConversationChain({
    llm: model,
    prompt: chatPrompt,
    verbose: true,
  });

  console.log(`\nAI is thinking...`)
  const start = performance.now()

  const response = await chain.call({
    elo,
    fen: board.fen,
    pgn: board.pgn,
  });

  const end = performance.now()
  console.log(`\nAI took ${end - start}ms to respond`)
  console.log(`\nAI response: ${JSON.stringify(response.results)}`)
  
  console.log(response.results);
  return response.results;
}

export async function POST(request: NextRequest) {
  try {
    const { board, elo, type, validMoves } = (await request.json()) as {
      board: { fen: string; pgn: string }
      elo: string
      type: RequestTypes
      validMoves: Move[]
    }

    if (!board || !elo || !type) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      )
    }

    const result = await playChess(board, elo, type, validMoves)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.log(error)

    return NextResponse.json(
      { success: false, message: "Internal application error" },
      { status: 500 }
    )
  }
}
