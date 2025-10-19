"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, type Application, type Vacancy, type EmployerCandidateMessage } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Briefcase, MapPin, Clock, MessageSquare, Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import Link from "next/link"

interface ApplicationWithVacancy extends Application {
  vacancy?: Vacancy
  messageCount?: number
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [applications, setApplications] = useState<ApplicationWithVacancy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }
      if (user.role !== "job_seeker") {
        router.push("/employer/dashboard")
        return
      }
      loadApplications()
    }
  }, [user, authLoading])

  const loadApplications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await api.getApplications({
        job_seeker_id: user.id,
        per_page: 100,
      })

      const applicationsData = response.applications as Application[]

      // Load vacancy details and message count for each application
      const applicationsWithVacancies = await Promise.all(
        applicationsData.map(async (app) => {
          try {
            const vacancy = await api.getVacancy(app.vacancy_id)
            
            // Загружаем количество сообщений для принятых/отклоненных заявок
            let messageCount = 0
            if (app.status === "accepted" || app.status === "rejected") {
              try {
                const messages = await api.getEmployerCandidateMessages(app.id)
                messageCount = messages.length
              } catch (error) {
                console.error(`Failed to load messages for application ${app.id}:`, error)
              }
            }
            
            return { ...app, vacancy, messageCount }
          } catch (error) {
            console.error(`[v0] Failed to load vacancy ${app.vacancy_id}:`, error)
            return app
          }
        }),
      )

      setApplications(applicationsWithVacancies)
    } catch (error) {
      console.error("[v0] Failed to load applications:", error)
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

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "all") return true
    return app.status === activeTab
  })

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewed: applications.filter((a) => a.status === "reviewed").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-secondary/20">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Мои отклики</h1>
            <p className="text-muted-foreground">Отслеживайте статус ваших откликов на вакансии</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Всего</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">В обработке</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.reviewed}</div>
                <p className="text-xs text-muted-foreground">Просмотрено</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                <p className="text-xs text-muted-foreground">Принято</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">Отклонено</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">Все ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">В обработке ({stats.pending})</TabsTrigger>
              <TabsTrigger value="reviewed">Просмотрено ({stats.reviewed})</TabsTrigger>
              <TabsTrigger value="accepted">Принято ({stats.accepted})</TabsTrigger>
              <TabsTrigger value="rejected">Отклонено ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredApplications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      {activeTab === "all" ? "У вас пока нет откликов" : "Нет откликов с этим статусом"}
                    </p>
                    {activeTab === "all" && (
                      <Button asChild>
                        <Link href="/vacancies">Найти вакансии</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map((application) => (
                    <Card key={application.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">
                              {application.vacancy ? (
                                <Link
                                  href={`/vacancies/${application.vacancy.id}`}
                                  className="hover:text-primary transition-colors"
                                >
                                  {application.vacancy.title}
                                </Link>
                              ) : (
                                `Вакансия #${application.vacancy_id}`
                              )}
                            </CardTitle>
                            {application.vacancy && (
                              <CardDescription className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                {application.vacancy.company}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(application.status)}
                            {application.messageCount && application.messageCount > 0 && (
                              <Badge className="bg-blue-600">
                                <Bell className="h-3 w-3 mr-1" />
                                {application.messageCount} {application.messageCount === 1 ? "сообщение" : "сообщений"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {application.vacancy && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {application.vacancy.location}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Отправлено{" "}
                              {formatDistanceToNow(new Date(application.created_at), { addSuffix: true, locale: ru })}
                            </div>
                          </div>

                          {application.cover_letter && (
                            <div>
                              <p className="text-sm font-medium mb-1">Сопроводительное письмо:</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">{application.cover_letter}</p>
                            </div>
                          )}

                          {application.mismatch_reasons && application.mismatch_reasons.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1 text-orange-600">Несоответствия:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {application.mismatch_reasons.map((reason, idx) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {application.vacancy && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/vacancies/${application.vacancy.id}`}>Посмотреть вакансию</Link>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/applications/${application.id}`}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Чат с AI-ботом
                              </Link>
                            </Button>
                            {application.messageCount && application.messageCount > 0 && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                asChild
                              >
                                <Link href={`/applications/${application.id}`}>
                                  <Bell className="h-4 w-4 mr-2" />
                                  {application.status === "accepted" ? "Открыть чат" : "Посмотреть ответ"}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
