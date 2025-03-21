import { useEffect, useRef, useState } from "react"
import useStore, { type Move } from "@/store/useStore"
import { zodResolver } from "@hookform/resolvers/zod"
import { Bot, Loader2, RedoIcon, UserIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Ratings, cn } from "@/lib/utils"

import { Alert, AlertDescription } from "./ui/alert"
import { Button } from "./ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form"
import { Input } from "./ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { useToast } from "./ui/use-toast"

interface ChatProps {
  chatId: string
}

interface ChatInteraction {
  isBot: boolean
  message: string
}

async function askQuestion(
  type: string,
  elo: string,
  board: { fen: string; pgn: string },
  validMoves: Partial<Move>[]
) {
  try {
    const response = await fetch(`/api/next-move`, {
      method: "POST",
      body: JSON.stringify({
        type,
        elo,
        board,
        validMoves,
      }),
    })

    if (response.ok) {
      return (await response.json()) as {
        success: boolean
        result?: {
          from: string
          explanation: string
          to: string
          winProbability?: number | undefined
        }
      }
    }

    return null
  } catch (e) {
    console.error(e)
    return null
  }
}

export function Chat({ chatId }: ChatProps) {
  const { toast } = useToast()
  const { setElo, elo, board, setAiPlay, aiPlay, setNextMove, validMoves } =
    useStore()
  const [processing, setProcessing] = useState(false)
  const [chatInteractions, setChatInteractions] = useState<ChatInteraction[]>([
    {
      message: `Hello, I'm Chester. I'm here to help you get better at chess. I will be playing as the black pieces.`,
      isBot: true,
    },
  ])
  const [latestCommand, setLatestCommand] = useState("")

  const formSchema = z.object({
    request: z.string().nonempty().describe("Request type"),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      request: "",
    },
  })

  useEffect(() => {
    if (aiPlay) {
      onAskQuestion("/opponent")
      setAiPlay(false)
    }
  }, [aiPlay, setAiPlay])

  const onAskQuestion = async (question: string) => {
    setChatInteractions((previousInteractions) => [
      ...previousInteractions,
      { isBot: false, message: question },
    ])

    setProcessing(true)
    const result = await askQuestion(question, elo, board, validMoves)
    setProcessing(false)

    if (result?.success && result.result) {
      const answer = result.result.explanation
      setChatInteractions((previousInteractions) => [
        ...previousInteractions,
        { isBot: true, message: answer },
      ])

      if (aiPlay) {
        setNextMove({
          from: result.result.from,
          to: result.result.to,
        })
      }

      return
    }

    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description: "There was a problem with your request.",
    })
  }

  const interactionsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (interactionsRef?.current?.lastElementChild) {
      interactionsRef.current.lastElementChild.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      })
    }
  }, [chatInteractions])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLatestCommand(data.request)
    await onAskQuestion(data.request)
  }

  const highlightCommand = (command: string) => {
    switch (command) {
      case "/coach":
        return "text-red-500 font-medium"
      case "/next-move":
        return "text-blue-500 font-medium"
      case "/mind-reader":
        return "text-orange-500 font-medium"
      case "/breakdown":
        return "text-green-500 font-medium"
      case "/opponent":
        return "text-purple-500 font-medium"
    }
  }

  return (
    <div className="w-full rounded-lg">
      <Select onValueChange={(val) => setElo(val as Ratings)}>
        <SelectTrigger className="mb-5 w-full" defaultValue={elo}>
          <SelectValue placeholder="Rating" defaultValue={elo} />
        </SelectTrigger>
        <SelectContent defaultValue={elo}>
          <SelectItem value="beginner">Novice (100-800)</SelectItem>
          <SelectItem value="intermediate">Intermediate (800-1500)</SelectItem>
          <SelectItem value="advanced">Advanced (1500-2000)</SelectItem>
          <SelectItem value="expert">Expert (2000+)</SelectItem>
        </SelectContent>
      </Select>
      <div
        ref={interactionsRef}
        className="flex h-[450px] flex-col gap-2 overflow-scroll rounded-lg bg-secondary p-2"
      >
        {chatInteractions.map((i, index) => (
          <Alert key={index} className={cn(highlightCommand(i.message))}>
            {i.isBot ? (
              <Bot className="size-4" />
            ) : (
              <UserIcon className="size-4" />
            )}
            <AlertDescription className="flex justify-between">
              <div>{i.message}</div>
              {i.isBot &&
                index === chatInteractions.length - 1 &&
                !(latestCommand === "/opponent") && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onAskQuestion(latestCommand)}
                      variant="ghost"
                    >
                      <RedoIcon className="size-4" />
                    </Button>
                  </div>
                )}
            </AlertDescription>
          </Alert>
        ))}

        {processing && (
          <Alert key="processing" className="animate-pulse">
            <Bot className="size-4" />
            <AlertDescription>...</AlertDescription>
          </Alert>
        )}
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-2 flex min-w-full flex-row gap-2"
        >
          <FormField
            control={form.control}
            name="request"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    disabled={processing}
                    type="text"
                    {...field}
                    placeholder="Ask any question"
                    onChangeCapture={field.onChange}
                    defaultValue={field.value}
                    className="w-[560px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={processing || !elo || aiPlay}
            className="min-w-[80px]"
          >
            {processing ? <Loader2 className="size-4 animate-spin" /> : "Ask"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
