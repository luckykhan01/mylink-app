"use client"

import type React from "react"

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
  embedded?: boolean // Если true, виджет будет отображаться без плавающей кнопки
  autoStart?: boolean // Автоматически начать анализ при загрузке
}

export function ChatbotWidget({ applicationId, vacancyId, onAnalysisComplete, embedded = false, autoStart = false }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(embedded ? true : false)
  const [inputValue, setInputValue] = useState("")
  const [questionCount, setQuestionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [analysisStarted, setAnalysisStarted] = useState(false) // Флаг что анализ уже запущен
  const [relevancePercent, setRelevancePercent] = useState<number | null>(null) // Текущая релевантность
  const [isDialogCompleted, setIsDialogCompleted] = useState(false) // Флаг завершения диалога
  const [localMessages, setLocalMessages] = useState<Array<{ id: string; role: string; text: string }>>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Привет! Я SmartBot - AI-ассистент для подбора персонала. Расскажите мне о себе и своем опыте работы. Чем вас заинтересовала эта вакансия?'
    }
  ])

  // Автоматически запускаем анализ при загрузке если autoStart = true
  useEffect(() => {
    console.log('useEffect triggered:', { autoStart, sessionId, analysisStarted, applicationId })
    if (autoStart && !analysisStarted && applicationId && applicationId !== '') {
      console.log('Starting AI analysis for application:', applicationId)
      startAIAnalysis()
    }
  }, [autoStart, analysisStarted, applicationId])

  const startAIAnalysis = async () => {
    console.log('startAIAnalysis called with applicationId:', applicationId)
    if (analysisStarted) {
      console.log('Analysis already started, skipping...')
      return
    }
    
    setIsLoading(true)
    setAnalysisStarted(true) // Устанавливаем флаг сразу чтобы избежать повторных вызовов
    
    try {
      console.log('Calling api.analyzeApplication...')
      const analysis = await api.analyzeApplication(Number(applicationId))
      console.log('AI Analysis response:', analysis)
      setSessionId(analysis.session_id)
      setRelevancePercent(analysis.relevance_percent) // Сохраняем релевантность
      
      // Новый API возвращает один вопрос (bot_reply) вместо массива
      if (analysis.bot_reply) {
        const aiMessage = {
          id: `ai-question-0`,
          role: 'assistant',
          text: analysis.bot_reply
        }
        setLocalMessages(prev => [...prev, aiMessage])
      } else if (analysis.followup_questions && analysis.followup_questions.length > 0) {
        // Обратная совместимость со старым API
        const firstQuestion = {
          id: `ai-question-0`,
          role: 'assistant',
          text: analysis.followup_questions[0]
        }
        setLocalMessages(prev => [...prev, firstQuestion])
      }
      
      console.log('AI Analysis completed:', analysis)
    } catch (error: any) {
      console.error('Failed to start AI analysis:', error)
      console.error('Error details:', error.message, error.response)
      // Fallback к локальным сообщениям
      const fallbackMessage = {
        id: 'fallback',
        role: 'assistant',
        text: `Извините, AI-анализ временно недоступен (${error.message || 'Unknown error'}). Пожалуйста, расскажите о себе в свободной форме.`
      }
      setLocalMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading || isDialogCompleted) return

    // Добавляем сообщение пользователя в локальный массив
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: inputValue
    }
    setLocalMessages(prev => [...prev, userMessage])
    setQuestionCount(prev => prev + 1)
    
    const userInput = inputValue
    setInputValue("")
    setIsLoading(true)
    
    try {
      console.log('handleSubmit - sessionId:', sessionId, 'userInput:', userInput)
      if (sessionId) {
        console.log('Sending message to AI assistant...')
        // Отправляем сообщение в AI-ассистента
        const chatResult = await api.sendChatMessage(Number(applicationId), sessionId, userInput)
        console.log('AI response:', chatResult)
        
        // Новый API возвращает один ответ (bot_reply) вместо массива
        if (chatResult.bot_reply) {
          const botMessage = {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            text: chatResult.bot_reply
          }
          setLocalMessages(prev => [...prev, botMessage])
        } else if (chatResult.bot_replies && chatResult.bot_replies.length > 0) {
          // Обратная совместимость со старым API
          chatResult.bot_replies.forEach((reply, index) => {
            const botMessage = {
              id: `bot-${Date.now()}-${index}`,
              role: 'assistant',
              text: reply
            }
            setLocalMessages(prev => [...prev, botMessage])
          })
        }
        
        // Обновляем релевантность
        if (chatResult.relevance_percent !== undefined) {
          setRelevancePercent(chatResult.relevance_percent)
        }
        
        // Проверяем, завершен ли анализ
        if (chatResult.is_completed) {
          setIsDialogCompleted(true)
          onAnalysisComplete?.(chatResult)
        }
      } else {
        console.warn('No sessionId - using fallback responses')
        // Fallback к локальным ответам если нет сессии
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
        }, 1000)
      }
    } catch (error: any) {
      console.error('Failed to send message to AI:', error)
      console.error('Error details:', error.message, error.response)
      // Fallback к локальным ответам
      setTimeout(() => {
        const botMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: `Спасибо за ваш ответ! Расскажите еще что-нибудь о себе. (Ошибка: ${error.message || 'Unknown'})`
        }
        setLocalMessages(prev => [...prev, botMessage])
      }, 1000)
    } finally {
      setIsLoading(false)
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
          <div className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Сообщений:</span>
              <span className="font-medium">{questionCount}</span>
            </div>
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
          {isDialogCompleted && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              ✅ Диалог завершен. Анализ передан работодателю. Спасибо за ответы!
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isDialogCompleted ? "Диалог завершен" : isLoading ? "AI обрабатывает ваш ответ..." : "Введите ваше сообщение..."}
              className="flex-1"
              disabled={isLoading || isDialogCompleted}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading || isDialogCompleted}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
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
          {isDialogCompleted && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              ✅ Диалог завершен. Анализ передан работодателю. Спасибо за ответы!
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isDialogCompleted ? "Диалог завершен" : isLoading ? "AI обрабатывает ваш ответ..." : "Введите ваше сообщение..."}
              className="flex-1"
              disabled={isLoading || isDialogCompleted}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading || isDialogCompleted}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
