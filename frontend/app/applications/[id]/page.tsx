"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { api, type Application, type Vacancy } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Briefcase, MapPin, Clock } from "lucide-react"
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

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }
      loadApplication()
    }
  }, [user, authLoading, params.id])

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
    try {
      await api.updateApplication(application!.id, {
        relevance_score: analysisData.relevanceScore / 100,
        mismatch_reasons: analysisData.mismatchReasons,
        status: "reviewed",
      })
      loadApplication()
    } catch (error) {
      console.error("[v0] Failed to update application:", error)
    }
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
                    {application.relevance_score !== undefined && (
                      <Badge variant="outline">Релевантность: {Math.round(application.relevance_score * 100)}%</Badge>
                    )}
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
                    <Button asChild>
                      <Link href={`/vacancies/${vacancy.id}`}>Посмотреть полное описание вакансии</Link>
                    </Button>
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
    </div>
  )
}
