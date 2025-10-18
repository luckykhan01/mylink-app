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
import { useAuth } from "@/lib/auth-context"
import { api, type Vacancy, type Application, type Message } from "@/lib/api"
import { ArrowLeft, AlertCircle, MessageSquare } from "lucide-react"
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
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)

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
  }, [applications, statusFilter, relevanceFilter])

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

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

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

    setFilteredApplications(filtered)
  }

  const handleViewChat = async (application: Application) => {
    setSelectedApplication(application)
    setIsChatOpen(true)
    try {
      const messages = await api.getMessages(application.id)
      setChatMessages(messages)
    } catch (error) {
      console.error("[v0] Failed to load chat messages:", error)
    }
  }

  const getRelevanceBadge = (score?: number) => {
    if (!score) return <Badge variant="secondary">Не оценено</Badge>
    const percentage = Math.round(score * 100)
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

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Статус</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="pending">В обработке</SelectItem>
                      <SelectItem value="reviewed">Просмотрено</SelectItem>
                      <SelectItem value="accepted">Принято</SelectItem>
                      <SelectItem value="rejected">Отклонено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Кандидаты ({filteredApplications.length})</CardTitle>
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
                              Просмотреть чат
                            </Button>
                            <Button size="sm" variant="outline">
                              Принять
                            </Button>
                            <Button size="sm" variant="ghost">
                              Отклонить
                            </Button>
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
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>История чата с кандидатом</DialogTitle>
            <DialogDescription>
              {selectedApplication && `Кандидат #${selectedApplication.job_seeker_id}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {chatMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет сообщений в чате</p>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.sender_type === "job_seeker" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.sender_type === "job_seeker" ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
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
    </div>
  )
}
