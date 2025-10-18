type User = {
  id: string
  email: string
  password: string
  full_name: string
  role: "employer" | "seeker"
  created_at: string
}

type Vacancy = {
  id: string
  employer_id: string
  title: string
  company: string
  location: string
  salary_min?: number
  salary_max?: number
  experience_level: string
  employment_type: string
  description: string
  requirements: string
  responsibilities: string
  benefits?: string
  is_remote: boolean
  is_active: boolean
  created_at: string
}

type Application = {
  id: string
  vacancy_id: string
  seeker_id: string
  resume: string
  cover_letter?: string
  status: "pending" | "reviewed" | "accepted" | "rejected"
  relevance_score?: number
  mismatch_reasons?: string[]
  chat_completed: boolean
  created_at: string
}

type Message = {
  id: string
  application_id: string
  sender_type: "bot" | "user"
  content: string
  created_at: string
}

class InMemoryDB {
  private users: Map<string, User> = new Map()
  private vacancies: Map<string, Vacancy> = new Map()
  private applications: Map<string, Application> = new Map()
  private messages: Map<string, Message> = new Map()
  private currentUserId = 1
  private currentVacancyId = 1
  private currentApplicationId = 1
  private currentMessageId = 1

  constructor() {
    if (process.env.SEED_TEST_DATA === "true") {
      this.seedData()
    }
  }

  private seedData() {
    // Seed employer user
    const employer: User = {
      id: "1",
      email: "employer@test.com",
      password: "password123",
      full_name: "John Employer",
      role: "employer",
      created_at: new Date().toISOString(),
    }
    this.users.set(employer.id, employer)

    // Seed seeker user
    const seeker: User = {
      id: "2",
      email: "seeker@test.com",
      password: "password123",
      full_name: "Jane Seeker",
      role: "seeker",
      created_at: new Date().toISOString(),
    }
    this.users.set(seeker.id, seeker)

    // Seed vacancies
    const vacancies: Omit<Vacancy, "id">[] = [
      {
        employer_id: "1",
        title: "Senior Frontend Developer",
        company: "TechCorp",
        location: "San Francisco, CA",
        salary_min: 120000,
        salary_max: 180000,
        experience_level: "6_plus_years",
        employment_type: "Full-time",
        description: "We are looking for an experienced Frontend Developer to join our team.",
        requirements: "5+ years of React experience, TypeScript, Next.js",
        responsibilities: "Build and maintain web applications, mentor junior developers",
        benefits: "Health insurance, 401k, remote work",
        is_remote: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        employer_id: "1",
        title: "Backend Engineer",
        company: "DataSystems Inc",
        location: "New York, NY",
        salary_min: 100000,
        salary_max: 150000,
        experience_level: "3_6_years",
        employment_type: "Full-time",
        description: "Join our backend team to build scalable APIs.",
        requirements: "3+ years Python/FastAPI, PostgreSQL, Docker",
        responsibilities: "Design and implement REST APIs, optimize database queries",
        benefits: "Competitive salary, stock options",
        is_remote: false,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ]

    vacancies.forEach((v) => {
      const id = String(this.currentVacancyId++)
      this.vacancies.set(id, { ...v, id })
    })
  }

  // Users
  createUser(user: Omit<User, "id" | "created_at">): User {
    const id = String(this.currentUserId++)
    const newUser: User = {
      ...user,
      id,
      created_at: new Date().toISOString(),
    }
    this.users.set(id, newUser)
    return newUser
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email === email)
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id)
  }

  // Vacancies
  createVacancy(vacancy: Omit<Vacancy, "id" | "created_at">): Vacancy {
    const id = String(this.currentVacancyId++)
    const newVacancy: Vacancy = {
      ...vacancy,
      id,
      created_at: new Date().toISOString(),
    }
    this.vacancies.set(id, newVacancy)
    return newVacancy
  }

  getVacancies(filters?: {
    company?: string
    location?: string
    experience_level?: string
    is_remote?: boolean
    search?: string
  }): Vacancy[] {
    let vacancies = Array.from(this.vacancies.values()).filter((v) => v.is_active)

    if (filters?.company) {
      vacancies = vacancies.filter((v) => v.company.toLowerCase().includes(filters.company!.toLowerCase()))
    }
    if (filters?.location) {
      vacancies = vacancies.filter((v) => v.location.toLowerCase().includes(filters.location!.toLowerCase()))
    }
    if (filters?.experience_level) {
      vacancies = vacancies.filter((v) => v.experience_level === filters.experience_level)
    }
    if (filters?.is_remote !== undefined) {
      vacancies = vacancies.filter((v) => v.is_remote === filters.is_remote)
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      vacancies = vacancies.filter(
        (v) =>
          v.title.toLowerCase().includes(search) ||
          v.company.toLowerCase().includes(search) ||
          v.description.toLowerCase().includes(search),
      )
    }

    return vacancies
  }

  getVacancyById(id: string): Vacancy | undefined {
    return this.vacancies.get(id)
  }

  getVacanciesByEmployer(employerId: string): Vacancy[] {
    return Array.from(this.vacancies.values()).filter((v) => v.employer_id === employerId)
  }

  updateVacancy(id: string, updates: Partial<Vacancy>): Vacancy | undefined {
    const vacancy = this.vacancies.get(id)
    if (!vacancy) return undefined

    const updated = { ...vacancy, ...updates }
    this.vacancies.set(id, updated)
    return updated
  }

  deleteVacancy(id: string): boolean {
    return this.vacancies.delete(id)
  }

  // Applications
  createApplication(application: Omit<Application, "id" | "created_at">): Application {
    const id = String(this.currentApplicationId++)
    const newApplication: Application = {
      ...application,
      id,
      created_at: new Date().toISOString(),
    }
    this.applications.set(id, newApplication)
    return newApplication
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications.get(id)
  }

  getApplicationsBySeeker(seekerId: string): Application[] {
    return Array.from(this.applications.values()).filter((a) => a.seeker_id === seekerId)
  }

  getApplicationsByVacancy(vacancyId: string): Application[] {
    return Array.from(this.applications.values()).filter((a) => a.vacancy_id === vacancyId)
  }

  updateApplication(id: string, updates: Partial<Application>): Application | undefined {
    const application = this.applications.get(id)
    if (!application) return undefined

    const updated = { ...application, ...updates }
    this.applications.set(id, updated)
    return updated
  }

  // Messages
  createMessage(message: Omit<Message, "id" | "created_at">): Message {
    const id = String(this.currentMessageId++)
    const newMessage: Message = {
      ...message,
      id,
      created_at: new Date().toISOString(),
    }
    this.messages.set(id, newMessage)
    return newMessage
  }

  getMessagesByApplication(applicationId: string): Message[] {
    return Array.from(this.messages.values())
      .filter((m) => m.application_id === applicationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }
}

// Singleton instance
export const db = new InMemoryDB()
