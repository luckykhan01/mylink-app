"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { api, type Vacancy, type Application } from "@/lib/api"
import { Plus, Briefcase, Users, Eye, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

export default function EmployerDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [applications, setApplications] = useState<Record<number, Application[]>>({})
  const [isLoading, setIsLoading] = useState(true)

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
      loadDashboardData()
    }
  }, [user, authLoading])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const vacanciesResponse = await api.getVacancies({ per_page: 100 })
      const vacanciesData = vacanciesResponse.vacancies as Vacancy[]
      const employerVacancies = vacanciesData.filter((v) => v.employer_id === user?.id)
      setVacancies(employerVacancies)

      const applicationsData: Record<number, Application[]> = {}
      for (const vacancy of employerVacancies) {
        const appsResponse = await api.getApplications({ vacancy_id: vacancy.id, per_page: 100 })
        applicationsData[vacancy.id] = appsResponse.applications as Application[]
      }
      setApplications(applicationsData)
    } catch (error) {
      console.error("[v0] Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalApplications = Object.values(applications).reduce((sum, apps) => sum + apps.length, 0)
  const activeVacancies = vacancies.filter((v) => v.is_active).length

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-secondary/20">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Панель работодателя</h1>
            <Button asChild>
              <Link href="/dashboard/vacancies/new">
                <Plus className="h-4 w-4 mr-2" />
                Создать вакансию
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего вакансий</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vacancies.length}</div>
                <p className="text-xs text-muted-foreground">{activeVacancies} активных</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего откликов</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalApplications}</div>
                <p className="text-xs text-muted-foreground">По всем вакансиям</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средняя релевантность</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalApplications > 0
                    ? Math.round(
                        (Object.values(applications)
                          .flat()
                          .reduce((sum, app) => sum + (app.relevance_score || 0), 0) /
                          totalApplications) *
                          100,
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Оценка AI</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Мои вакансии</CardTitle>
              <CardDescription>Управляйте вакансиями и просматривайте отклики кандидатов</CardDescription>
            </CardHeader>
            <CardContent>
              {vacancies.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">У вас пока нет вакансий</p>
                  <Button asChild>
                    <Link href="/dashboard/vacancies/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Создать первую вакансию
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {vacancies.map((vacancy) => {
                    const vacancyApps = applications[vacancy.id] || []
                    const avgRelevance =
                      vacancyApps.length > 0
                        ? Math.round(
                            (vacancyApps.reduce((sum, app) => sum + (app.relevance_score || 0), 0) /
                              vacancyApps.length) *
                              100,
                          )
                        : 0

                    return (
                      <Card key={vacancy.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{vacancy.title}</h3>
                                {vacancy.is_active ? (
                                  <Badge variant="default">Активна</Badge>
                                ) : (
                                  <Badge variant="secondary">Неактивна</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{vacancy.company}</p>
                              <p className="text-sm text-muted-foreground">
                                Создана{" "}
                                {formatDistanceToNow(new Date(vacancy.created_at), { addSuffix: true, locale: ru })}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right">
                                <div className="text-2xl font-bold">{vacancyApps.length}</div>
                                <div className="text-xs text-muted-foreground">откликов</div>
                              </div>
                              {vacancyApps.length > 0 && <Badge variant="outline">Средняя: {avgRelevance}%</Badge>}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button asChild size="sm">
                              <Link href={`/dashboard/vacancies/${vacancy.id}/candidates`}>
                                <Users className="h-4 w-4 mr-2" />
                                Кандидаты
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/dashboard/vacancies/${vacancy.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Редактировать
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
