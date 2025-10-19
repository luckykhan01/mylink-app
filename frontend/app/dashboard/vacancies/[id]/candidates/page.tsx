"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { api, type Vacancy, type Application, type Message, type EmployerCandidateMessage } from "@/lib/api"
import { ArrowLeft, AlertCircle, MessageSquare, Bot, Check, X, Send, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function CandidatesPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [vacancy, setVacancy] = useState<Vacancy | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [relevanceFilter, setRelevanceFilter] = useState<string>("all")
  const [tagFilter, setTagFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [employerChatMessages, setEmployerChatMessages] = useState<EmployerCandidateMessage[]>([])
  const [isEmployerChatOpen, setIsEmployerChatOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isDetailedAnalysisOpen, setIsDetailedAnalysisOpen] = useState(false)
  const [detailedAnalysisContent, setDetailedAnalysisContent] = useState("")

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }
      if (user.role !== "employer") {
        router.push("/vacancies")
        return
      }
      loadData()
    }
  }, [user, authLoading, params.id])

  useEffect(() => {
    filterApplications()
  }, [applications, statusFilter, relevanceFilter, tagFilter, activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const vacancyData = await api.getVacancy(Number(params.id))
      setVacancy(vacancyData)

      const appsResponse = await api.getApplications({ vacancy_id: Number(params.id), per_page: 100 })
      setApplications(appsResponse.applications as Application[])
    } catch (error) {
      console.error("[v0] Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Фильтр по вкладкам
    if (activeTab === "accepted") {
      filtered = filtered.filter((app) => app.status === "accepted")
    } else if (activeTab === "rejected") {
      filtered = filtered.filter((app) => app.status === "rejected")
    }

    // Дополнительный фильтр по релевантности
    if (relevanceFilter !== "all") {
      filtered = filtered.filter((app) => {
        const score = (app.relevance_score || 0) * 100
        switch (relevanceFilter) {
          case "high":
            return score >= 70
          case "medium":
            return score >= 40 && score < 70
          case "low":
            return score < 40
          default:
            return true
        }
      })
    }

    // Фильтр по тегам отклонения
    if (tagFilter !== "all") {
      filtered = filtered.filter((app) => {
        const tags = app.rejection_tags?.split(',').map(t => t.trim()) || []
        return tags.includes(tagFilter)
      })
    }

    setFilteredApplications(filtered)
  }

  // Получить количество кандидатов по статусу
  const getCandidateCount = (status: string) => {
    if (status === "all") return applications.length
    if (status === "accepted") return applications.filter((app) => app.status === "accepted").length
    if (status === "rejected") return applications.filter((app) => app.status === "rejected").length
    return 0
  }

  const handleViewChat = async (application: Application) => {
    setSelectedApplication(application)
    setIsChatOpen(true)
    try {
      const messages = await api.getMessages(application.id)
      setChatMessages(messages)
    } catch (error) {
      console.error("[v0] Failed to load chat messages:", error)
      setChatMessages([])
    }
  }

  const handleAccept = async (application: Application) => {
    try {
      await api.handleApplicationAction(application.id, "accept")
      toast({
        title: "Заявка принята",
        description: "Теперь вы можете начать общение с кандидатом",
      })
      // Открываем чат работодателя с кандидатом
      setSelectedApplication(application)
      loadEmployerChat(application.id)
      setIsEmployerChatOpen(true)
      // Обновляем список заявок
      loadData()
    } catch (error) {
      console.error("Failed to accept application:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось принять заявку",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (application: Application) => {
    try {
      await api.handleApplicationAction(application.id, "reject")
      toast({
        title: "Заявка отклонена",
        description: "Кандидату отправлено уведомление",
      })
      // Обновляем список заявок
      loadData()
    } catch (error) {
      console.error("Failed to reject application:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить заявку",
        variant: "destructive",
      })
    }
  }

  const loadEmployerChat = async (applicationId: number) => {
    try {
      const messages = await api.getEmployerCandidateMessages(applicationId)
      setEmployerChatMessages(messages)
    } catch (error) {
      console.error("Failed to load employer chat:", error)
      setEmployerChatMessages([])
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedApplication || isSendingMessage || !user) return

    setIsSendingMessage(true)
    try {
      const message = await api.sendEmployerCandidateMessage(selectedApplication.id, newMessage, user.id)
      setEmployerChatMessages((prev) => [...prev, message])
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleViewDetailedAnalysis = (application: Application) => {
    setDetailedAnalysisContent(application.ai_detailed_analysis || "Детальный анализ не доступен")
    setIsDetailedAnalysisOpen(true)
  }

  const getRelevanceBadge = (score?: number) => {
    const percentage = Math.round((score || 0) * 100)
    if (percentage >= 70) {
      return <Badge className="bg-green-600">Высокая: {percentage}%</Badge>
    } else if (percentage >= 40) {
      return <Badge className="bg-orange-600">Средняя: {percentage}%</Badge>
    } else {
      return <Badge variant="destructive">Низкая: {percentage}%</Badge>
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-secondary/20">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-64" />
          </div>
        </main>
      </div>
    )
  }

  if (!vacancy) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Вакансия не найдена</p>
              <Button asChild>
                <Link href="/dashboard">Вернуться к панели</Link>
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
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к панели
            </Link>
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{vacancy.title}</h1>
            <p className="text-muted-foreground">{vacancy.company}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Всего откликов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applications.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Высокая релевантность</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {applications.filter((app) => (app.relevance_score || 0) >= 0.7).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Средняя релевантность</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {
                    applications.filter((app) => {
                      const score = app.relevance_score || 0
                      return score >= 0.4 && score < 0.7
                    }).length
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Низкая релевантность</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {applications.filter((app) => (app.relevance_score || 0) < 0.4).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Все кандидаты ({getCandidateCount("all")})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-green-600 data-[state=active]:text-green-700">
                Принятые ({getCandidateCount("accepted")})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-red-600 data-[state=active]:text-red-700">
                Отклоненные ({getCandidateCount("rejected")})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Дополнительные фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Релевантность</label>
                  <Select value={relevanceFilter} onValueChange={setRelevanceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все уровни</SelectItem>
                      <SelectItem value="high">Высокая (70%+)</SelectItem>
                      <SelectItem value="medium">Средняя (40-70%)</SelectItem>
                      <SelectItem value="low">Низкая (&lt;40%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Причина несоответствия</label>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все причины</SelectItem>
                      <SelectItem value="relocation">Проблемы с локацией/переездом</SelectItem>
                      <SelectItem value="exp_gap">Недостаточный опыт</SelectItem>
                      <SelectItem value="salary_mismatch">Несовпадение по зарплате</SelectItem>
                      <SelectItem value="schedule_conflict">Несовпадение графика</SelectItem>
                      <SelectItem value="skill_mismatch">Несовпадение навыков</SelectItem>
                      <SelectItem value="language_barrier">Проблемы с языками</SelectItem>
                      <SelectItem value="education_gap">Несовпадение образования</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && "Все кандидаты"}
                {activeTab === "accepted" && "Принятые кандидаты"}
                {activeTab === "rejected" && "Отклоненные кандидаты"}
                {" "}({filteredApplications.length})
              </CardTitle>
              <CardDescription>Отклики отсортированы по релевантности</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Нет откликов по выбранным фильтрам</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApplications
                    .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
                    .map((application) => (
                      <Card key={application.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">Кандидат #{application.job_seeker_id}</h3>
                                {getStatusBadge(application.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Отправлено{" "}
                                {formatDistanceToNow(new Date(application.created_at), {
                                  addSuffix: true,
                                  locale: ru,
                                })}
                              </p>
                            </div>
                            {getRelevanceBadge(application.relevance_score)}
                          </div>

                          {application.cover_letter && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">Сопроводительное письмо</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">{application.cover_letter}</p>
                            </div>
                          )}

                          {application.ai_summary && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  <Bot className="h-4 w-4" />
                                  Анализ AI
                                </h4>
                                {application.ai_detailed_analysis && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewDetailedAnalysis(application)}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Подробнее
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                {application.ai_summary}
                              </p>
                              {application.rejection_tags && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {application.rejection_tags.split(',').map((tag, idx) => {
                                    const tagLabels: Record<string, string> = {
                                      'relocation': 'Локация',
                                      'exp_gap': 'Опыт',
                                      'salary_mismatch': 'Зарплата',
                                      'schedule_conflict': 'График',
                                      'skill_mismatch': 'Навыки',
                                      'language_barrier': 'Языки',
                                      'education_gap': 'Образование'
                                    }
                                    const cleanTag = tag.trim()
                                    return cleanTag ? (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {tagLabels[cleanTag] || cleanTag}
                                      </Badge>
                                    ) : null
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {application.mismatch_reasons && application.mismatch_reasons.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                Несоответствия
                              </h4>
                              <ul className="space-y-1">
                                {application.mismatch_reasons.slice(0, 2).map((reason, idx) => (
                                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-orange-600 mt-0.5">•</span>
                                    <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewChat(application)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Просмотреть чат с AI
                            </Button>
                            {application.status === "accepted" ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedApplication(application)
                                  loadEmployerChat(application.id)
                                  setIsEmployerChatOpen(true)
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Написать кандидату
                              </Button>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="bg-green-50 hover:bg-green-100"
                                  onClick={() => handleAccept(application)}
                                  disabled={application.status === "rejected"}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Принять
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleReject(application)}
                                  disabled={application.status === "rejected"}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Отклонить
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>История чата с кандидатом</DialogTitle>
            <DialogDescription>
              {selectedApplication && `Кандидат #${selectedApplication.job_seeker_id}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-2">
            {chatMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет сообщений в чате</p>
            ) : (
              chatMessages.map((message, index) => (
                <div
                  key={`${message.id}-${index}`}
                  className={cn("flex", message.sender_type === "job_seeker" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.sender_type === "job_seeker" ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: ru })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог чата между работодателем и кандидатом */}
      <Dialog open={isEmployerChatOpen} onOpenChange={setIsEmployerChatOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Чат с кандидатом</DialogTitle>
            <DialogDescription>
              {selectedApplication && selectedApplication.job_seeker && 
                `${selectedApplication.job_seeker.full_name || `Кандидат #${selectedApplication.job_seeker_id}`}`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-2">
            {employerChatMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Начните общение с кандидатом
              </p>
            ) : (
              employerChatMessages.map((message, index) => (
                <div
                  key={`${message.id}-${index}`}
                  className={cn(
                    "flex",
                    message.sender_type === "employer" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.sender_type === "employer"
                        ? "bg-primary text-primary-foreground"
                        : message.sender_type === "system"
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-muted"
                    )}
                  >
                    {message.sender_name && message.sender_type !== "employer" && (
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
        </DialogContent>
      </Dialog>

      {/* Диалог детального анализа от AI */}
      <Dialog open={isDetailedAnalysisOpen} onOpenChange={setIsDetailedAnalysisOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Детальный анализ кандидата
            </DialogTitle>
            <DialogDescription>
              Подробный отчет от AI-ассистента SmartBot
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {detailedAnalysisContent}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
