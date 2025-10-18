"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface ChatbotWidgetProps {
  applicationId: string
  vacancyId: string
  onAnalysisComplete?: (analysis: any) => void
}

export function ChatbotWidget({ applicationId, vacancyId, onAnalysisComplete }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [questionCount, setQuestionCount] = useState(0)
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { applicationId, vacancyId },
    }),
  })

  useEffect(() => {
    if (isOpen && !hasLoadedHistory) {
      loadChatHistory()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && hasLoadedHistory && messages.length === 0) {
      sendMessage({
        text: "Start the interview process. Introduce yourself and ask the first question.",
      })
    }
  }, [isOpen, hasLoadedHistory])

  useEffect(() => {
    const userMessages = messages.filter((m) => m.role === "user")
    setQuestionCount(userMessages.length)

    if (userMessages.length >= 5) {
      handleAnalysis()
    }

    if (messages.length > 0) {
      saveLastMessage()
    }
  }, [messages])

  const loadChatHistory = async () => {
    try {
      const history = await api.getMessages(Number(applicationId))
      console.log("[v0] Loaded chat history:", history.length, "messages")
      setHasLoadedHistory(true)
    } catch (error) {
      console.error("[v0] Failed to load chat history:", error)
      setHasLoadedHistory(true)
    }
  }

  const saveLastMessage = async () => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    const content = lastMessage.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ")

    try {
      await api.createMessage(Number(applicationId), lastMessage.role === "user" ? "job_seeker" : "bot", content)
    } catch (error) {
      console.error("[v0] Failed to save message:", error)
    }
  }

  const handleAnalysis = async () => {
    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.parts.map((p) => (p.type === "text" ? p.text : "")).join(" "),
      }))

      const response = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: "User resume data",
          vacancy: { id: vacancyId },
          chatHistory: JSON.stringify(chatHistory),
        }),
      })

      const analysis = await response.json()
      onAnalysisComplete?.(analysis)
    } catch (error) {
      console.error("[v0] Analysis error:", error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || status === "in_progress") return

    sendMessage({ text: inputValue })
    setInputValue("")
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90 transition-all duration-200",
          isOpen && "scale-0",
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Card
        className={cn(
          "fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col",
          "transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">SmartBot</h3>
              <p className="text-xs opacity-90">AI Recruitment Assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 py-2 bg-muted/50 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Questions answered</span>
            <span className="font-medium">{questionCount}/5</span>
          </div>
          <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(questionCount / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <p key={index} className="text-sm leading-relaxed">
                        {part.text}
                      </p>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          ))}
          {status === "in_progress" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your answer..."
              disabled={status === "in_progress" || questionCount >= 5}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || status === "in_progress" || questionCount >= 5}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {questionCount >= 5 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Interview complete! Analyzing your responses...
            </p>
          )}
        </form>
      </Card>
    </>
  )
}
