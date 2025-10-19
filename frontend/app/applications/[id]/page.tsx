"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { api, type Application, type Vacancy, type EmployerCandidateMessage } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Briefcase, MapPin, Clock, MessageSquare, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import Link from "next/link"
import { ChatbotWidget } from "@/components/chatbot-widget"

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [vacancy, setVacancy] = useState<Vacancy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [analysis, setAnalysis] = useState<any>(null)
  const [employerMessages, setEmployerMessages] = useState<EmployerCandidateMessage[]>([])
  const [isMessagesDialogOpen, setIsMessagesDialogOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }
      loadApplication()
    }
  }, [user, authLoading, params.id])

  // Автоматически загружаем сообщения когда статус меняется на accepted или rejected
  useEffect(() => {
    if (application && (application.status === "accepted" || application.status === "rejected")) {
      loadEmployerMessages()
    }
  }, [application?.status])

  const loadApplication = async () => {
    setIsLoading(true)
    try {
      const response = await api.getApplications({
        job_seeker_id: user?.id,
        per_page: 100,
      })

      const applicationsData = response.applications as Application[]
      const app = applicationsData.find((a) => a.id === Number(params.id))

      if (app) {
        setApplication(app)
        const vacancyData = await api.getVacancy(app.vacancy_id)
        setVacancy(vacancyData)
      }
    } catch (error) {
      console.error("[v0] Failed to load application:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: Application["status"]) => {
    const variants: Record<
      Application["status"],
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      pending: { variant: "secondary", label: "В обработке" },
      reviewed: { variant: "default", label: "Просмотрено" },
      accepted: { variant: "default", label: "Принято" },
      rejected: { variant: "destructive", label: "Отклонено" },
    }
    const config = variants[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleAnalysisComplete = async (analysisData: any) => {
    setAnalysis(analysisData)
    loadApplication()
  }

  const loadEmployerMessages = async () => {
    if (!application) return
    try {
      const messages = await api.getEmployerCandidateMessages(application.id)
      setEmployerMessages(messages)
    } catch (error) {
      console.error("Failed to load employer messages:", error)
      setEmployerMessages([])
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !application || isSendingMessage || !user) return

    setIsSendingMessage(true)
    try {
      const message = await api.sendEmployerCandidateMessage(application.id, newMessage, user.id)
      setEmployerMessages((prev) => [...prev, message])
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const openMessagesDialog = () => {
    loadEmployerMessages()
    setIsMessagesDialogOpen(true)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-secondary/20">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-6" />
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Отклик не найден</p>
              <Button asChild>
                <Link href="/applications">Вернуться к откликам</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к откликам
            </Link>
          </Button>

          {/* Уведомление о новых сообщениях */}
          {employerMessages.length > 0 && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">
                        {application?.status === "accepted" 
                          ? "У вас новое сообщение от работодателя!" 
                          : "Работодатель ответил по вашей заявке"}
                      </p>
                      <p className="text-sm text-blue-700">
                        {employerMessages.length} {employerMessages.length === 1 ? "сообщение" : "сообщений"}
                      </p>
                    </div>
                  </div>
                  <Button onClick={openMessagesDialog}>
                    Открыть чат
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {vacancy ? vacancy.title : `Вакансия #${application.vacancy_id}`}
                    </CardTitle>
                    {vacancy && (
                      <CardDescription className="flex items-center gap-2 text-base">
                        <Briefcase className="h-5 w-5" />
                        {vacancy.company}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(application.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  {vacancy && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{vacancy.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Отправлено{" "}
                      {formatDistanceToNow(new Date(application.created_at), { addSuffix: true, locale: ru })}
                    </span>
                  </div>
                </div>

                {application.cover_letter && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Сопроводительное письмо</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{application.cover_letter}</p>
                    </div>
                  </>
                )}

                {application.mismatch_reasons && application.mismatch_reasons.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-orange-600">Выявленные несоответствия</h3>
                      <ul className="space-y-1 text-muted-foreground">
                        {application.mismatch_reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-orange-600 mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {vacancy && (
                  <>
                    <Separator />
                    <div className="flex gap-3">
                      {(application.status === "accepted" || application.status === "rejected") && (
                        <Button variant="outline" onClick={openMessagesDialog}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {application.status === "accepted" ? "Сообщения от работодателя" : "Посмотреть ответ"}
                        </Button>
                      )}
                      <Button asChild>
                        <Link href={`/vacancies/${vacancy.id}`}>Посмотреть полное описание вакансии</Link>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Чат с AI-ботом SmartBot</CardTitle>
                <CardDescription>
                  SmartBot задаст вам уточняющие вопросы для оценки вашего соответствия вакансии
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Анализ завершен!</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">{analysis.summary}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-semibold mb-2">Сильные стороны</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {analysis.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-600 mt-1">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Области для улучшения</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {analysis.weaknesses.map((weakness: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-orange-600 mt-1">•</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-secondary/50 rounded-lg p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      Нажмите на кнопку чата в правом нижнем углу, чтобы начать интервью с SmartBot
                    </p>
                    <p className="text-sm text-muted-foreground">SmartBot задаст 5 вопросов о вашем опыте и навыках</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {application && vacancy && (
        <ChatbotWidget
          applicationId={String(application.id)}
          vacancyId={String(vacancy.id)}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}

      {/* Диалог сообщений от работодателя */}
      <Dialog open={isMessagesDialogOpen} onOpenChange={setIsMessagesDialogOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {application?.status === "accepted" ? "Сообщения от работодателя" : "Ответ по вашей заявке"}
            </DialogTitle>
            <DialogDescription>
              {vacancy && `${vacancy.company} - ${vacancy.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-2">
            {employerMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет сообщений</p>
            ) : (
              employerMessages.map((message, index) => (
                <div
                  key={`${message.id}-${index}`}
                  className={cn(
                    "flex",
                    message.sender_type === "job_seeker" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.sender_type === "job_seeker"
                        ? "bg-primary text-primary-foreground"
                        : message.sender_type === "system"
                        ? "bg-amber-50 border border-amber-200 text-amber-900"
                        : "bg-muted"
                    )}
                  >
                    {message.sender_name && message.sender_type === "employer" && (
                      <p className="text-xs font-semibold mb-1">{message.sender_name}</p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: ru })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {application?.status === "accepted" && (
            <div className="flex gap-2 pt-4 border-t">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Введите сообщение..."
                disabled={isSendingMessage}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSendingMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
