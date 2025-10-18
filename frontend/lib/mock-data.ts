import type { Vacancy, Application, PaginatedResponse } from "./api"

export const mockVacancies: Vacancy[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp",
    location: "Москва",
    salary_min: 200000,
    salary_max: 350000,
    currency: "RUB",
    description:
      "Мы ищем опытного Frontend разработчика для работы над современными веб-приложениями. Вы будете работать с React, TypeScript и Next.js.",
    requirements: "- 5+ лет опыта с React\n- Отличное знание TypeScript\n- Опыт с Next.js\n- Понимание принципов UI/UX",
    benefits: "- Гибкий график\n- ДМС\n- Обучение за счет компании\n- Современный офис",
    employment_type: "full_time",
    experience_level: "senior",
    remote_work: true,
    is_active: true,
    created_at: new Date().toISOString(),
    employer_id: 1,
  },
  {
    id: 2,
    title: "Backend Developer (Python)",
    company: "DataSoft",
    location: "Санкт-Петербург",
    salary_min: 150000,
    salary_max: 250000,
    currency: "RUB",
    description: "Разработка и поддержка backend сервисов на Python. Работа с FastAPI, PostgreSQL, Redis.",
    requirements:
      "- 3+ года опыта с Python\n- Знание FastAPI или Django\n- Опыт работы с PostgreSQL\n- Понимание REST API",
    benefits: "- Удаленная работа\n- ДМС\n- 28 дней отпуска",
    employment_type: "full_time",
    experience_level: "middle",
    remote_work: true,
    is_active: true,
    created_at: new Date().toISOString(),
    employer_id: 2,
  },
  {
    id: 3,
    title: "Full Stack Developer",
    company: "StartupHub",
    location: "Казань",
    salary_min: 120000,
    salary_max: 200000,
    currency: "RUB",
    description: "Ищем универсального разработчика для работы над стартап-проектами. React + Node.js.",
    requirements: "- 2+ года опыта\n- React и Node.js\n- MongoDB или PostgreSQL\n- Git",
    benefits: "- Гибкий график\n- Опционы компании\n- Молодая команда",
    employment_type: "full_time",
    experience_level: "middle",
    remote_work: false,
    is_active: true,
    created_at: new Date().toISOString(),
    employer_id: 3,
  },
  {
    id: 4,
    title: "Junior React Developer",
    company: "WebStudio",
    location: "Москва",
    salary_min: 80000,
    salary_max: 120000,
    currency: "RUB",
    description: "Отличная возможность для начинающих разработчиков. Обучение и менторство.",
    requirements:
      "- Базовые знания React\n- HTML, CSS, JavaScript\n- Желание учиться\n- Английский язык (чтение документации)",
    benefits: "- Менторство\n- Обучение\n- Дружная команда\n- Офис в центре",
    employment_type: "full_time",
    experience_level: "junior",
    remote_work: false,
    is_active: true,
    created_at: new Date().toISOString(),
    employer_id: 4,
  },
  {
    id: 5,
    title: "DevOps Engineer",
    company: "CloudTech",
    location: "Удаленно",
    salary_min: 180000,
    salary_max: 300000,
    currency: "RUB",
    description: "Настройка и поддержка инфраструктуры. Работа с Kubernetes, Docker, CI/CD.",
    requirements:
      "- 3+ года опыта DevOps\n- Kubernetes, Docker\n- CI/CD (GitLab CI, GitHub Actions)\n- Linux администрирование",
    benefits: "- Полностью удаленная работа\n- ДМС\n- Гибкий график\n- Современный стек",
    employment_type: "full_time",
    experience_level: "senior",
    remote_work: true,
    is_active: true,
    created_at: new Date().toISOString(),
    employer_id: 5,
  },
  {
    id: 6,
    title: "UI/UX Designer",
    company: "DesignLab",
    location: "Москва",
    salary_min: 100000,
    salary_max: 180000,
    currency: "RUB",
    description: "Создание интерфейсов для веб и мобильных приложений. Работа в Figma.",
    requirements: "- Портфолио\n- Опыт работы в Figma\n- Понимание UX принципов\n- Знание трендов дизайна",
    benefits: "- Креативная среда\n- Гибкий график\n- ДМС\n- Обучение",
    employment_type: "full_time",
    experience_level: "middle",
    remote_work: true,
    is_active: true,
    created_at: new Date().toISOString(),
    employer_id: 6,
  },
]

export const mockApplications: Application[] = [
  {
    id: 1,
    cover_letter: "Я заинтересован в этой позиции и готов приступить к работе.",
    status: "pending",
    created_at: new Date().toISOString(),
    job_seeker_id: 1,
    vacancy_id: 1,
    relevance_score: 85,
    mismatch_reasons: ["Недостаточно опыта с TypeScript"],
  },
]

export function getMockVacancies(params?: {
  page?: number
  per_page?: number
  search?: string
  company?: string
  location?: string
  experience_level?: string
  remote_work?: boolean
}): PaginatedResponse<Vacancy> {
  let filtered = [...mockVacancies]

  // Apply filters
  if (params?.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (v) =>
        v.title.toLowerCase().includes(search) ||
        v.company.toLowerCase().includes(search) ||
        v.description.toLowerCase().includes(search),
    )
  }

  if (params?.company) {
    filtered = filtered.filter((v) => v.company === params.company)
  }

  if (params?.location) {
    filtered = filtered.filter((v) => v.location === params.location)
  }

  if (params?.experience_level) {
    filtered = filtered.filter((v) => v.experience_level === params.experience_level)
  }

  if (params?.remote_work !== undefined) {
    filtered = filtered.filter((v) => v.remote_work === params.remote_work)
  }

  // Pagination
  const page = params?.page || 1
  const per_page = params?.per_page || 12
  const start = (page - 1) * per_page
  const end = start + per_page
  const paginated = filtered.slice(start, end)

  return {
    vacancies: paginated,
    total: filtered.length,
    page,
    per_page,
    total_pages: Math.ceil(filtered.length / per_page),
  }
}

export function getMockVacancy(id: number): Vacancy | undefined {
  return mockVacancies.find((v) => v.id === id)
}

export function getMockCompanies(): string[] {
  return Array.from(new Set(mockVacancies.map((v) => v.company)))
}

export function getMockLocations(): string[] {
  return Array.from(new Set(mockVacancies.map((v) => v.location)))
}

export function getMockApplications(params?: {
  page?: number
  per_page?: number
  job_seeker_id?: number
  vacancy_id?: number
  status?: string
}): PaginatedResponse<Application> {
  let filtered = [...mockApplications]

  if (params?.job_seeker_id) {
    filtered = filtered.filter((a) => a.job_seeker_id === params.job_seeker_id)
  }

  if (params?.vacancy_id) {
    filtered = filtered.filter((a) => a.vacancy_id === params.vacancy_id)
  }

  if (params?.status) {
    filtered = filtered.filter((a) => a.status === params.status)
  }

  const page = params?.page || 1
  const per_page = params?.per_page || 12
  const start = (page - 1) * per_page
  const end = start + per_page
  const paginated = filtered.slice(start, end)

  return {
    applications: paginated,
    total: filtered.length,
    page,
    per_page,
    total_pages: Math.ceil(filtered.length / per_page),
  }
}
