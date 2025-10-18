// Используем прокси API route для всех запросов
// Это решает проблемы с CORS и timeout
const API_BASE_URL = typeof window === 'undefined' 
  ? 'http://backend:8000' 
  : '/api/proxy'

const USE_MOCK_DATA = false

export interface User {
  id: number
  email: string
  full_name: string
  phone?: string
  role: "employer" | "job_seeker"
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  phone?: string
  role: "employer" | "job_seeker"
}

export interface Vacancy {
  id: number
  title: string
  company: string
  location: string
  salary_min?: number
  salary_max?: number
  currency?: string
  description: string
  requirements: string
  responsibilities?: string
  benefits?: string
  employment_type?: string
  experience_level?: string
  remote_work: boolean
  is_active: boolean
  created_at: string
  updated_at?: string
  employer_id: number
}

export interface Application {
  id: number
  cover_letter?: string
  status: "pending" | "reviewed" | "accepted" | "rejected"
  created_at: string
  updated_at?: string
  job_seeker_id: number
  vacancy_id: number
  vacancy?: Vacancy
  job_seeker?: Partial<User>
}

export interface Message {
  id: string
  content: string
  sender_type: "bot" | "user"
  created_at: string
  application_id: string
}

class ApiClient {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (includeAuth && typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }

    return headers
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Registration failed")
    }

    // После регистрации сразу авторизуем пользователя
    const loginResult = await this.login(data.email, data.password)

    return loginResult
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Login failed")
    }

    const data = await response.json()

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("user", JSON.stringify(data.user))
    }

    return data
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user")
    }

    return response.json()
  }

  async getVacancies(params?: {
    page?: number
    per_page?: number
    search?: string
    company?: string
    location?: string
    experience_level?: string
    remote_work?: boolean
  }): Promise<{ vacancies: Vacancy[]; total: number; page: number; per_page: number; total_pages: number }> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(`${API_BASE_URL}/vacancies?${queryParams}`)

    if (!response.ok) {
      throw new Error("Failed to fetch vacancies")
    }

    return response.json()
  }

  async getVacancy(id: string): Promise<Vacancy> {
    const response = await fetch(`${API_BASE_URL}/vacancies/${id}`)

    if (!response.ok) {
      throw new Error("Failed to fetch vacancy")
    }

    return response.json()
  }

  async createApplication(data: {
    vacancy_id: number
    cover_letter?: string
  }): Promise<Application> {
    // Получаем текущего пользователя для получения job_seeker_id
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {}
    
    const response = await fetch(`${API_BASE_URL}/applications?job_seeker_id=${user.id}`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to create application")
    }

    return response.json()
  }

  async getApplications(params?: {
    vacancy_id?: string
    status?: string
  }): Promise<{ applications: Application[] }> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(`${API_BASE_URL}/applications?${queryParams}`, {
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch applications")
    }

    return response.json()
  }

  async getApplication(id: string): Promise<Application> {
    const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch application")
    }

    return response.json()
  }

  async updateApplication(
    applicationId: string,
    data: {
      status?: Application["status"]
      relevance_score?: number
      mismatch_reasons?: string[]
      chat_completed?: boolean
    },
  ): Promise<Application> {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
      method: "PATCH",
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to update application")
    }

    return response.json()
  }

  async createVacancy(data: Omit<Vacancy, "id" | "created_at" | "updated_at" | "employer_id">): Promise<Vacancy> {
    // Получаем текущего пользователя для получения employer_id
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {}
    
    const response = await fetch(`${API_BASE_URL}/vacancies?employer_id=${user.id}`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to create vacancy")
    }

    return response.json()
  }

  async updateVacancy(
    vacancyId: string,
    data: Partial<Omit<Vacancy, "id" | "created_at" | "updated_at" | "employer_id">>,
  ): Promise<Vacancy> {
    const response = await fetch(`${API_BASE_URL}/vacancies/${vacancyId}`, {
      method: "PUT",
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to update vacancy")
    }

    return response.json()
  }

  async deleteVacancy(vacancyId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/vacancies/${vacancyId}`, {
      method: "DELETE",
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      throw new Error("Failed to delete vacancy")
    }
  }

  async getCompanies(): Promise<string[]> {
    const { vacancies } = await this.getVacancies()
    const companies = [...new Set(vacancies.map((v) => v.company))]
    return companies
  }

  async getLocations(): Promise<string[]> {
    const { vacancies } = await this.getVacancies()
    const locations = [...new Set(vacancies.map((v) => v.location))]
    return locations
  }

  async getMessages(applicationId: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/messages?application_id=${applicationId}`, {
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch messages")
    }

    const data = await response.json()
    return data.messages || []
  }

  async createMessage(applicationId: string, senderType: Message["sender_type"], content: string): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({
        application_id: applicationId,
        sender_type: senderType,
        content,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to create message")
    }

    return response.json()
  }

  async uploadResume(applicationId: number, file: File): Promise<{ message: string; filename: string }> {
    const formData = new FormData()
    formData.append("file", file)

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    const headers: HeadersInit = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/upload-resume`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to upload resume")
    }

    return response.json()
  }
}

export const api = new ApiClient()
