"use client"

import React, { useEffect, useState } from "react"
import useStore from "@/store/useStore"
import { Chess } from "chess.js"
import Chessboard from "chessboardjsx"

const ChessGame = () => {
  const { setAiPlay, nextMove, setNextMove, setBoard, setValidMoves } = useStore()
  const [game, setGame] = useState<Chess>(new Chess())
  const [moveFrom, setMoveFrom] = useState("")

  useEffect(() => {
    setAiPlay(game.turn() === "b")
    setBoard({
      fen: game.fen(),
      pgn: game.pgn(),
    })
    const validMoves = game.moves({ verbose: true}).map((move) => {
      return {
        from: move.from,
        to: move.to,
        piece: move.piece,
      }
    })
    setValidMoves(validMoves)
  }, [game.fen()])

  useEffect(() => {
    if (nextMove && game.turn() === "b") {
      game.move({
        from: nextMove.from,
        to: nextMove.to,
        promotion: "q",
      })
      setGame(game)
      setNextMove(undefined)
    }
  }, [nextMove])

  const onSquareClick = (square: string) => {
    if (moveFrom === "") {
      setMoveFrom(square)
    } else if (moveFrom === square) {
      setMoveFrom("")
    } else {
      const move = game.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      })

      if (move === null) {
        setMoveFrom("")
        return
      }

      setGame(game)
      setMoveFrom("")
    }
  }

  const onSquareRightClick = (square: string) => {
    if (moveFrom === "") {
      setMoveFrom(square)
    } else {
      const move = game.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      })

      if (move === null) {
        setMoveFrom("")
        return
      }

      setGame(game)
      setMoveFrom("")
    }
  }

  return (
    <div>
      <Chessboard
        id="ClickToMove"
        position={game.fen()}
        onSquareClick={onSquareClick}
        onSquareRightClick={onSquareRightClick}
      />
      {/* <Button
        onClick={() => {
          safeGameMutate((game) => {
            game.reset()
          })
          setMoveSquares({})
          setRightClickedSquares({})
        }}
      >
        reset
      </Button>
      <Button
        onClick={() => {
          safeGameMutate((game) => {
            game.undo()
          })
          setMoveSquares({})
          setRightClickedSquares({})
        }}
      >
        undo
      </Button> */}
    </div>
  )
}

export default ChessGame
