"use client"

import Link from "next/link"
import useStore from "@/store/useStore"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Chat } from "@/components/chat"
import Chessboard from "@/components/chessboard"

export default function IndexPage() {
  const { clearStore } = useStore()

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-3xl md:text-5xl lg:text-6xl">
          Hello, Im Chester
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
          I am an AI bot designed to help you get better at chess.
        </p>
      </div>
      <div className="flex gap-4">
        <Button onClick={clearStore}>
          <Link target="_blank" href={siteConfig.links.article}>
            Learn More
          </Link>
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">How to</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chester Commands</DialogTitle>
              <DialogDescription>
                <div className="text-center sm:text-left">
                  <div className="mt-2">
                    <ul className="list-inside list-disc space-y-6 text-sm text-gray-700 dark:text-gray-300">
                      <li>
                        <strong className="text-green-500">/breakdown:</strong>{" "}
                        As a chess coach, I&apos;ll provide a detailed breakdown of
                        the current state of the chess game, considering the
                        positions of the pieces, potential threats, and tactical
                        opportunities. For this command, I&apos;ll be coaching for
                        the white pieces.
                      </li>
                      <li>
                        <strong className="text-blue-500">/next-move:</strong>{" "}
                        I&apos;ll scrutinize the present situation on the board and
                        suggest the most advantageous next move for the white
                        player. I&apos;ll explain the reasoning behind the suggested
                        move.
                      </li>
                      <li>
                        <strong className="text-orange-500">
                          /mind-reader:
                        </strong>{" "}
                        In this mode, I&apos;ll think like the player and plan out
                        the next three moves. Each move and its reasoning will
                        be explained.
                      </li>
                      <li>
                        <strong className="text-red-500">/coach:</strong> Here,
                        I&apos;ll find the best possible move for the black player
                        and explain the thought process behind the decision.
                      </li>
                    </ul>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <section className="flex justify-between space-x-7">
        <div className="w-1/2">
          <Chat chatId="chatId" />
        </div>
        <div className="w-1/2">
          <Chessboard />
        </div>
      </section>
    </section>
  )
}
