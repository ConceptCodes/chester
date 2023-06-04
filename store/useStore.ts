import { mountStoreDevtool } from "simple-zustand-devtools"
import { create, type StateCreator } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type Move = {
  from: string
  to: string
}

interface State {
  elo: string
  showConfetti: boolean
  aiPlay: boolean
  board: { fen: string; pgn: string }
  nextMove: Move | undefined
  validMoves: Partial<Move>[]
  setElo: (elo: string) => void
  setBoard: (board: { fen: string; pgn: string }) => void
  setValidMoves: (validMoves: Partial<Move>[]) => void
  setAiPlay: (aiPlay: boolean) => void
  setNextMove: (nextMove: Move | undefined) => void
  setShowConfetti: (showConfetti: boolean | undefined) => void
  clearStore: () => void
}

const store: StateCreator<State> = persist(
  (set) => ({
    elo: "100-800",
    showConfetti: false,
    aiPlay: false,
    nextMove: undefined,
    board: { fen: "", pgn: "" },
    validMoves: [],
    setElo: (elo) => set({ elo }),
    setAiPlay: (aiPlay) => set({ aiPlay }),
    setValidMoves: (validMoves) => set({ validMoves }),
    setShowConfetti: (showConfetti) => set({ showConfetti }),
    setNextMove: (nextMove) => set({ nextMove }),
    setBoard: (board) => set({ board }),
    clearStore: () =>
      set({
        elo: "100-800",
        showConfetti: false,
        aiPlay: false,
        nextMove: undefined,
      }),
  }),
  {
    name: "chester-store",
    storage: createJSONStorage(() => localStorage),
  }
) as StateCreator<State>

const useStore = create<State>(store)

export default useStore

if (process.env.NODE_ENV === "development") {
  mountStoreDevtool("chester-store", useStore)
}
