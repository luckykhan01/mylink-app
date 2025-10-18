"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

interface VacancyFiltersProps {
  filters: {
    company: string
    location: string
    experience_level: string
    remote_work: boolean | undefined
  }
  onFilterChange: (filters: Partial<VacancyFiltersProps["filters"]>) => void
}

export function VacancyFilters({ filters, onFilterChange }: VacancyFiltersProps) {
  const [companies, setCompanies] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  useEffect(() => {
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    try {
      const [companiesData, locationsData] = await Promise.all([api.getCompanies(), api.getLocations()])
      setCompanies(companiesData)
      setLocations(locationsData)
    } catch (error) {
      console.error("[v0] Failed to load filter options:", error)
    }
  }

  const handleReset = () => {
    onFilterChange({
      company: "",
      location: "",
      experience_level: "",
      remote_work: undefined,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Фильтры</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Компания</Label>
          <Select value={filters.company} onValueChange={(value) => onFilterChange({ company: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Все компании" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все компании</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Локация</Label>
          <Select value={filters.location} onValueChange={(value) => onFilterChange({ location: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Все локации" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все локации</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Уровень опыта</Label>
          <Select
            value={filters.experience_level}
            onValueChange={(value) => onFilterChange({ experience_level: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Любой" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой</SelectItem>
              <SelectItem value="no_experience">Нет опыта</SelectItem>
              <SelectItem value="1_3_years">1-3 года</SelectItem>
              <SelectItem value="3_6_years">3-6 лет</SelectItem>
              <SelectItem value="6_plus_years">Больше 6 лет</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Удаленная работа</Label>
          <RadioGroup
            value={filters.remote_work === undefined ? "all" : filters.remote_work ? "yes" : "no"}
            onValueChange={(value) =>
              onFilterChange({
                remote_work: value === "all" ? undefined : value === "yes",
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="font-normal cursor-pointer">
                Все
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="font-normal cursor-pointer">
                Только удаленная
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="font-normal cursor-pointer">
                Только офис
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button variant="outline" className="w-full bg-transparent" onClick={handleReset}>
          Сбросить фильтры
        </Button>
      </CardContent>
    </Card>
  )
}
