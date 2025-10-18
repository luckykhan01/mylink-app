"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { VacancySearch } from "./components/vacancy-search"
import { VacancyFilters } from "./components/vacancy-filters"
import { VacancyList } from "./components/vacancy-list"
import { api, type Vacancy } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: "",
    company: "",
    location: "",
    experience_level: "",
    remote_work: undefined as boolean | undefined,
  })

  useEffect(() => {
    loadVacancies()
  }, [page, filters])

  const loadVacancies = async () => {
    setIsLoading(true)
    try {
      const response = await api.getVacancies({
        page,
        per_page: 12,
        ...filters,
      })
      setVacancies(response.vacancies as Vacancy[])
      setTotal(response.total)
    } catch (error) {
      console.error("[v0] Failed to load vacancies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search })
    setPage(1)
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters })
    setPage(1)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Найти работу</h1>
            <p className="text-muted-foreground">
              {total} {total === 1 ? "вакансия" : total < 5 ? "вакансии" : "вакансий"} доступно
            </p>
          </div>

          <VacancySearch onSearch={handleSearch} initialValue={filters.search} />

          <div className="grid lg:grid-cols-[280px_1fr] gap-6 mt-6">
            <aside>
              <VacancyFilters filters={filters} onFilterChange={handleFilterChange} />
            </aside>

            <div>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : (
                <VacancyList vacancies={vacancies} total={total} page={page} onPageChange={setPage} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
