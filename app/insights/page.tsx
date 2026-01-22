"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "assistant" | "user"
  content: string
}

export default function InsightsPage() {
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [userInput, setUserInput] = useState("")
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)
  const [speechIdx, setSpeechIdx] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [chartImg, setChartImg] = useState<string | null>(null)
  const router = useRouter()
  const ariaAnnounceRef = useRef<HTMLDivElement>(null)
  const msgEndRef = useRef<HTMLDivElement>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const announce = (message: string) => {
    if (ariaAnnounceRef.current) {
      ariaAnnounceRef.current.textContent = message
    }
  }

  useEffect(() => {
    const storedInsights = sessionStorage.getItem("chartInsights")
    const storedImage = sessionStorage.getItem("chartImage")
    
    if (storedInsights) {
      setChatMessages([{ role: "assistant", content: storedInsights }])
      setLoadingInsights(false)
      announce("Chart insights loaded successfully")
    } else {
      announce("No chart data found. Redirecting to upload page.")
      router.push("/")
    }
    
    if (storedImage) {
      setChartImg(storedImage)
    }
  }, [router])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const speakMessage = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()

      const cleanedText = text
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#{1,6}\s/g, "")
        .replace(/`/g, "")

      const utterance = new SpeechSynthesisUtterance(cleanedText)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = audioMuted ? 0 : 1

      utterance.onstart = () => {
        setSpeaking(true)
        announce("Started reading insights")
      }

      utterance.onend = () => {
        setSpeaking(false)
        setAudioPlaying(false)
        announce("Finished reading insights")
      }

      utterance.onerror = () => {
        setSpeaking(false)
        setAudioPlaying(false)
      }

      speechRef.current = utterance
      window.speechSynthesis.speak(utterance)
      setAudioPlaying(true)
    }
  }

  const toggleSpeech = () => {
    if (audioPlaying) {
      window.speechSynthesis.pause()
      setAudioPlaying(false)
      announce("Speech paused")
    } else if (speaking) {
      window.speechSynthesis.resume()
      setAudioPlaying(true)
      announce("Speech resumed")
    } else {
      const assistantMsgs = chatMessages.filter(m => m.role === "assistant")
      if (assistantMsgs.length > 0) {
        speakMessage(assistantMsgs[speechIdx]?.content || assistantMsgs[0].content)
      }
    }
  }

  const stopSpeech = () => {
    window.speechSynthesis.cancel()
    setAudioPlaying(false)
    setSpeaking(false)
    setSpeechIdx(0)
    announce("Speech stopped and reset")
  }

  const toggleMute = () => {
    setAudioMuted(!audioMuted)
    if (speechRef.current) {
      speechRef.current.volume = audioMuted ? 1 : 0
    }
    announce(audioMuted ? "Unmuted" : "Muted")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    const questionText = userInput.trim()
    setChatMessages(prev => [...prev, { role: "user", content: questionText }])
    setUserInput("")
    announce("Question submitted. Generating response...")

    try {
      const formPayload = new FormData()
      
      if (chartImg) {
        const resp = await fetch(chartImg)
        const imageBlob = await resp.blob()
        formPayload.append("image", imageBlob)
      }
      
      formPayload.append("question", questionText)
      formPayload.append("history", JSON.stringify(chatMessages))

      const apiResp = await fetch("/api/analyze-chart", {
        method: "POST",
        body: formPayload,
      })

      if (!apiResp.ok) {
        throw new Error("Failed to get response")
      }

      const respData = await apiResp.json()
      setChatMessages(prev => [...prev, { role: "assistant", content: respData.insights }])
      announce("Response received. New insight available.")
    } catch (err) {
      console.error("Error getting response:", err)
      const errMsg = "I apologize, but I'm having trouble generating a response right now. Please try again."
      setChatMessages(prev => [...prev, { role: "assistant", content: errMsg }])
      announce("Error generating response. Please try again.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div
        ref={ariaAnnounceRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            AI Insights
          </h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Get detailed analysis and ask questions about your chart data. 
            Use the speech controls to have insights read aloud.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" aria-hidden="true" />
              Text-to-Speech Controls
            </CardTitle>
            <CardDescription>
              Listen to AI insights through speech synthesis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 bg-transparent"
                onClick={stopSpeech}
                aria-label="Stop and reset speech"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                className="h-14 w-14 rounded-full"
                onClick={toggleSpeech}
                aria-label={audioPlaying ? "Pause speech" : "Play speech"}
                aria-pressed={audioPlaying}
              >
                {audioPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 bg-transparent"
                onClick={toggleMute}
                aria-label={audioMuted ? "Unmute" : "Mute"}
                aria-pressed={audioMuted}
              >
                {audioMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
            {speaking && (
              <p className="mt-4 text-center text-sm text-primary animate-pulse">
                Reading insights aloud...
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
              AI Analysis Chat
            </CardTitle>
            <CardDescription>
              Ask questions to explore your data deeper
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="h-[400px] overflow-y-auto rounded-lg bg-muted/30 p-4 mb-4"
              role="log"
              aria-label="Chat messages"
              aria-live="polite"
            >
              {loadingInsights ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" aria-hidden="true" />
                    <p className="text-muted-foreground">Loading insights...</p>
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "mb-4 flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      message.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                    aria-hidden="true"
                  >
                    {message.role === "assistant" ? (
                      <Bot className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 max-w-[80%]",
                      message.role === "assistant"
                        ? "bg-card border border-border text-card-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="sr-only">
                      {message.role === "assistant" ? "AI Assistant:" : "You:"}
                    </p>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content.split("\n").map((line, i) => (
                        <p key={i} className={cn(line.startsWith("**") && "font-semibold", line.startsWith("-") && "ml-2")}>
                          {line.replace(/\*\*/g, "")}
                        </p>
                      ))}
                    </div>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 text-xs"
                        onClick={() => speakMessage(message.content)}
                        aria-label="Read this message aloud"
                      >
                        <Volume2 className="h-3 w-3 mr-1" aria-hidden="true" />
                        Read aloud
                      </Button>
                    )}
                  </div>
                </div>
              ))}
                  <div ref={msgEndRef} />
                </>
              )}            </div>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <label htmlFor="question-input" className="sr-only">
                  Ask a question about your chart data
                </label>
                <Textarea
                  ref={inputRef}
                  id="question-input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your chart data..."
                  className="min-h-[56px] resize-none pr-12"
                  rows={1}
                  aria-describedby="input-hint"
                />
                <p id="input-hint" className="sr-only">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="h-14 w-14 shrink-0"
                disabled={!userInput.trim()}
                aria-label="Send question"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="mt-6" aria-labelledby="quick-questions-heading">
          <h3 id="quick-questions-heading" className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            Quick Questions
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "What's the overall growth rate?",
              "Which month performed best?",
              "Are there any concerning trends?",
              "Summarize in one sentence",
            ].map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                className="text-sm bg-transparent"
                onClick={() => {
                  setUserInput(question)
                  inputRef.current?.focus()
                }}
                aria-label={`Ask: ${question}`}
              >
                {question}
              </Button>
            ))}
          </div>
        </section>

        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/")}
            className="min-h-[56px] px-8 text-lg"
          >
            Upload New Chart
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/analyze")}
            className="min-h-[56px] px-8 text-lg"
          >
            Back to Analysis
          </Button>
        </div>
      </main>
    </div>
  )
}
