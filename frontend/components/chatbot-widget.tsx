"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface ChatbotWidgetProps {
  applicationId: string
  vacancyId: string
  onAnalysisComplete?: (analysis: any) => void
  embedded?: boolean // Если true, виджет будет отображаться без плавающей кнопки
}

export function ChatbotWidget({ applicationId, vacancyId, onAnalysisComplete, embedded = false }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(embedded ? true : false)
  const [inputValue, setInputValue] = useState("")
  const [questionCount, setQuestionCount] = useState(0)
  const [localMessages, setLocalMessages] = useState<Array<{ id: string; role: string; text: string }>>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Привет! Я SmartBot - AI-ассистент для подбора персонала. Расскажите мне о себе и своем опыте работы. Чем вас заинтересовала эта вакансия?'
    }
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Добавляем сообщение пользователя в локальный массив
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: inputValue
    }
    setLocalMessages(prev => [...prev, userMessage])
    setQuestionCount(prev => prev + 1)
    
    // Сохраняем в базу через API
    saveMessageToAPI('user', inputValue)
    
    setInputValue("")
    
    // Имитация ответа бота (пока API не готов)
    setTimeout(() => {
      const botResponses = [
        'Спасибо за ваш ответ! Это очень интересно. Расскажите подробнее о вашем опыте.',
        'Отлично! А можете рассказать о конкретных проектах, над которыми вы работали?',
        'Понятно. Какие технологии вы использовали в последнее время?',
        'Интересно! Какие задачи вам нравится решать больше всего?',
        'Хорошо. Почему вы заинтересовались именно этой вакансией?',
        'Спасибо! Есть ли у вас вопросы о компании или позиции?'
      ]
      
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]
      
      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: randomResponse
      }
      setLocalMessages(prev => [...prev, botMessage])
      saveMessageToAPI('assistant', botMessage.text)
    }, 1000)
  }
  
  const saveMessageToAPI = async (role: string, content: string) => {
    try {
      await api.createMessage(
        Number(applicationId), 
        role === 'user' ? 'job_seeker' : 'bot', 
        content
      )
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  // Если встроенный режим, рендерим только содержимое без кнопки и позиционирования
  if (embedded) {
    return (
      <Card className="w-full h-full flex flex-col border-0 shadow-none">
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">SmartBot</h3>
              <p className="text-xs opacity-90">AI Recruitment Assistant</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 bg-muted/50 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Сообщений отправлено</span>
            <span className="font-medium">{questionCount}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {localMessages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <p className="text-sm leading-relaxed">
                  {message.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Введите ваше сообщение..."
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
    )
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
            <span className="text-muted-foreground">Сообщений отправлено</span>
            <span className="font-medium">{questionCount}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {localMessages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <p className="text-sm leading-relaxed">
                  {message.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Введите ваше сообщение..."
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
