"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type Vacancy } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { MapPin, DollarSign, Clock, Building2, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import Link from "next/link"
import { ApplicationDialog } from "./components/application-dialog"

export default function VacancyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [vacancy, setVacancy] = useState<Vacancy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)

  useEffect(() => {
    loadVacancy()
  }, [params.id])

  const loadVacancy = async () => {
    setIsLoading(true)
    try {
      const data = await api.getVacancy(Number(params.id))
      setVacancy(data)
    } catch (error) {
      console.error("[v0] Failed to load vacancy:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (!user) {
      router.push("/login")
      return
    }
    setShowApplicationDialog(true)
  }

  if (isLoading) {
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

  if (!vacancy) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Вакансия не найдена</p>
              <Button asChild>
                <Link href="/vacancies">Вернуться к вакансиям</Link>
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
            <Link href="/vacancies">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к вакансиям
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{vacancy.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-base">
                    <Building2 className="h-5 w-5" />
                    {vacancy.company}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  {vacancy.remote_work && <Badge variant="secondary">Удаленно</Badge>}
                  {vacancy.experience_level && (
                    <Badge variant="outline" className="capitalize">
                      {vacancy.experience_level}
                    </Badge>
                  )}
                  {vacancy.employment_type && (
                    <Badge variant="outline" className="capitalize">
                      {vacancy.employment_type}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{vacancy.location}</span>
                </div>
                {(vacancy.salary_min || vacancy.salary_max) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {vacancy.salary_min && vacancy.salary_max
                        ? `${vacancy.salary_min.toLocaleString()} - ${vacancy.salary_max.toLocaleString()}`
                        : vacancy.salary_min
                          ? `от ${vacancy.salary_min.toLocaleString()}`
                          : `до ${vacancy.salary_max?.toLocaleString()}`}
                      {vacancy.currency && ` ${vacancy.currency}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(new Date(vacancy.created_at), { addSuffix: true, locale: ru })}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Описание</h3>
                <p className="text-muted-foreground whitespace-pre-line">{vacancy.description}</p>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Требования</h3>
                <p className="text-muted-foreground whitespace-pre-line">{vacancy.requirements}</p>
              </div>

              {vacancy.benefits && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Что мы предлагаем</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{vacancy.benefits}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-4">
                <Button size="lg" onClick={handleApply} disabled={user?.role === "employer"}>
                  {user?.role === "employer" ? "Только для соискателей" : "Откликнуться"}
                </Button>
                {!user && (
                  <p className="text-sm text-muted-foreground self-center">
                    <Link href="/login" className="text-primary hover:underline">
                      Войдите
                    </Link>
                    , чтобы откликнуться
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {user && vacancy && (
        <ApplicationDialog
          open={showApplicationDialog}
          onOpenChange={setShowApplicationDialog}
          vacancy={vacancy}
          userId={user.id}
        />
      )}
    </div>
  )
}
