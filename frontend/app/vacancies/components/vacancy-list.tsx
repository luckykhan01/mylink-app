"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Briefcase, MapPin, DollarSign, Clock } from "lucide-react"
import type { Vacancy } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

interface VacancyListProps {
  vacancies: Vacancy[]
  total: number
  page: number
  onPageChange: (page: number) => void
}

export function VacancyList({ vacancies, total, page, onPageChange }: VacancyListProps) {
  const perPage = 12
  const totalPages = Math.ceil(total / perPage)

  if (vacancies.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Вакансии не найдены. Попробуйте изменить фильтры.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {vacancies.map((vacancy) => (
          <Card key={vacancy.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">
                    <Link href={`/vacancies/${vacancy.id}`} className="hover:text-primary transition-colors">
                      {vacancy.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {vacancy.company}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {vacancy.remote_work && <Badge variant="secondary">Удаленно</Badge>}
                  {vacancy.experience_level && (
                    <Badge variant="outline" className="capitalize">
                      {vacancy.experience_level}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {vacancy.location}
                  </div>
                  {(vacancy.salary_min || vacancy.salary_max) && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {vacancy.salary_min && vacancy.salary_max
                        ? `${vacancy.salary_min.toLocaleString()} - ${vacancy.salary_max.toLocaleString()}`
                        : vacancy.salary_min
                          ? `от ${vacancy.salary_min.toLocaleString()}`
                          : `до ${vacancy.salary_max?.toLocaleString()}`}
                      {vacancy.currency && ` ${vacancy.currency}`}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(vacancy.created_at), { addSuffix: true, locale: ru })}
                  </div>
                </div>

                <p className="text-sm line-clamp-2">{vacancy.description}</p>

                <div className="flex justify-end">
                  <Button asChild>
                    <Link href={`/vacancies/${vacancy.id}`}>Подробнее</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && onPageChange(page - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1
              if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink onClick={() => onPageChange(pageNum)} isActive={page === pageNum}>
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              }
              if (pageNum === page - 2 || pageNum === page + 2) {
                return (
                  <PaginationItem key={pageNum}>
                    <span className="px-4">...</span>
                  </PaginationItem>
                )
              }
              return null
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => page < totalPages && onPageChange(page + 1)}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
