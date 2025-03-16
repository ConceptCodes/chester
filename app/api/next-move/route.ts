import { NextRequest, NextResponse } from "next/server"
import type { Move } from "@/store/useStore"
import { LLMChain } from "langchain/chains"
import { ChatOpenAI } from "langchain/chat_models/openai"
import {
  OutputFixingParser,
  StructuredOutputParser,
} from "langchain/output_parsers"
import { PromptTemplate } from "langchain/prompts"
import { z } from "zod"

import type { Commands } from "@/lib/utils"

// Configure OpenAI model
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPEN_AI_API_KEY as string,
  temperature: 0,
  maxTokens: 2000,
  verbose: true,
  modelName: "gpt-4o-mini",
})

// Chess move output schema
const chessParser = StructuredOutputParser.fromZodSchema(
  z.object({
    explanation: z
      .string()
      .nonempty()
      .describe(
        "Detailed explanation of the move from the first-person perspective."
      ),
    winProbability: z
      .number()
      .describe(
        "Probability of winning after the move, 0 if no probability is available."
      ),
    to: z
      .string()
      .nonempty()
      .describe(
        "Destination square for the piece; use 'EMPTY' if no move is required."
      ),
    from: z
      .string()
      .nonempty()
      .describe(
        "Starting square for the piece; use 'EMPTY' if no move is required."
      ),
  })
)

type ChessParserResponseType = z.infer<typeof chessParser.schema>

const outputFixingParser = OutputFixingParser.fromLLM(model, chessParser)

/**
 * Generates a prompt template based on the given action.
 */
function getActionTemplate(action: Commands, elo: string, validMoves: Move[]) {
  const commonTemplate = `
    Current PGN: {pgn}
    Current FEN: {fen}\n
    Please ensure your response follows these guidelines: {formatInstruction}.
  `

  const templates: Record<Commands, string> = {
    "/breakdown": `
      ${commonTemplate}
      As a ${elo} chess tutor, analyze the current board state. Identify threats, opportunities, and strategic insights. 
      Avoid suggesting moves—only provide observations.
    `,
    "/next-move": `
      ${commonTemplate}
      As a ${elo} chess coach, guide your student (playing White) in choosing the best move.
      Justify the move based on strategy, potential threats, and opportunities.
      Valid moves: {validMoves}.
    `,
    "/mind-reader": `
      ${commonTemplate}
      As a ${elo} chess player, assume the role of Black and strategize for the next three moves.
      Justify each move and anticipate the opponent’s response.
      Valid moves: {validMoves}.
    `,
    "/opponent": `
      ${commonTemplate}
      As a ${elo} chess player, determine the best move for Black and explain your reasoning.
      Provide an estimated win probability after the move.
      Valid moves: {validMoves}.
    `
  }

  const defaultTemplate = `${commonTemplate}
      As a ${elo} chess tutor named Chester, respond to the user's question based on the game state.
      If the question is unclear, suggest a relevant command from: /breakdown, /next-move, /mind-reader, /opponent.
    `

  return templates[action] ?? defaultTemplate
}

/**
 * Handles chess move generation and analysis.
 */
export async function playChess(
  board: { fen: string; pgn: string },
  elo: string,
  action: Commands,
  validMoves: Move[]
): Promise<ChessParserResponseType> {
  const format = chessParser.getFormatInstructions()
  const actionTemplate = getActionTemplate(action, elo, validMoves)

  const actionTemplatePrompt = new PromptTemplate({
    template: actionTemplate,
    inputVariables: ["elo", "pgn", "fen"],
    partialVariables: {
      validMoves: JSON.stringify(validMoves),
      formatInstruction: format,
      question: action,
    },
    outputParser: outputFixingParser,
  })

  const chain = new LLMChain({ llm: model, prompt: actionTemplatePrompt })

  console.log(
    `[INFO] Sending request to OpenAI: ${JSON.stringify({
      elo,
      fen: board.fen,
      pgn: board.pgn,
      action,
    })}`
  )

  const startTime = performance.now()
  const response = await chain.call({
    elo,
    fen: board.fen,
    pgn: board.pgn,
  })
  const endTime = performance.now()

  console.log(
    `[INFO] OpenAI response time: ${Math.fround((endTime - startTime) / 1000)}s`
  )
  console.log(`[INFO] AI Response: ${JSON.stringify(response.text)}`)

  return response.text as ChessParserResponseType
}

/**
 * Handles POST requests for chess move evaluation.
 */
export async function POST(request: NextRequest) {
  try {
    const { board, elo, type, validMoves } = (await request.json()) as {
      board: { fen: string; pgn: string }
      elo: string
      type: Commands
      validMoves: Move[]
    }

    if (!board?.fen || !board?.pgn || !elo || !type) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required parameters: board, elo, or type.",
        },
        { status: 400 }
      )
    }

    console.log(
      `[INFO] Received chess request: ${JSON.stringify({ board, elo, type })}`
    )

    const result = await playChess(board, elo, type, validMoves)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error(`[ERROR] Chess API encountered an error: ${error}`)

    return NextResponse.json(
      { success: false, message: "Internal application error." },
      { status: 500 }
    )
  }
}
