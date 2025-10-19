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
  relevance_score?: number
  ai_summary?: string
  ai_detailed_analysis?: string
  mismatch_reasons?: string[]
}

export interface Message {
  id: string
  content: string
  sender_type: "bot" | "user"
  created_at: string
  application_id: string
}

export interface EmployerCandidateMessage {
  id: number
  content: string
  sender_type: "employer" | "job_seeker" | "system"
  sender_id: number
  sender_name?: string
  application_id: number
  created_at: string
  is_read: boolean
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
    console.log('API register called with data:', data)
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    console.log('Register response status:', response.status)
    if (!response.ok) {
      const error = await response.json()
      console.error('Register error:', error)
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

  async getMessages(applicationId: string | number): Promise<Message[]> {
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
    console.log('📁 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)
    
    const formData = new FormData()
    formData.append("file", file)

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    const headers: HeadersInit = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    // НЕ устанавливаем Content-Type для FormData - браузер сделает это автоматически с boundary

    // Для загрузки файлов ОБЯЗАТЕЛЬНО используем прямое подключение к бэкенду
    // Next.js прокси не может корректно передавать multipart/form-data
    const uploadUrl = `http://localhost:8000/applications/${applicationId}/upload-resume`
    
    console.log('🌐 [CLIENT] Direct upload to:', uploadUrl)
    console.log('🌐 Window exists:', typeof window !== "undefined")
    
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: formData,
      mode: 'cors',
      credentials: 'omit'
    })

    console.log('📡 Response status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to upload resume")
    }

    return response.json()
  }

  // ===== AI ANALYSIS METHODS =====

  async analyzeApplication(applicationId: number, cvText?: string, vacancyText?: string): Promise<{
    session_id: string
    relevance_percent: number
    reasons: string[]
    summary_for_employer: string
    bot_reply?: string
    dialog_stage?: string
    is_completed?: boolean
    // Старые поля для обратной совместимости
    mismatches?: Record<string, any>
    followup_questions?: string[]
  }> {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/analyze`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({
        cv_text: cvText,
        vacancy_text: vacancyText,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to analyze application")
    }

    return response.json()
  }

  async sendChatMessage(applicationId: number, sessionId: string, message: string): Promise<{
    session_id: string
    bot_reply: string
    relevance_percent: number
    reasons: string[]
    summary_for_employer: string
    dialog_stage?: string
    is_completed?: boolean
    // Старое поле для обратной совместимости
    bot_replies?: string[]
  }> {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/chat`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({
        session_id: sessionId,
        message,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to send chat message")
    }

    return response.json()
  }

  async getAISession(applicationId: number, sessionId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/session/${sessionId}`, {
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to get AI session")
    }

    return response.json()
  }

  // ===== APPLICATION ACTIONS =====

  async handleApplicationAction(
    applicationId: number,
    action: "accept" | "reject",
    message?: string
  ): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/action`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({
        action,
        message,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to handle application action")
    }

    return response.json()
  }

  // ===== EMPLOYER-CANDIDATE CHAT =====

  async getEmployerCandidateMessages(applicationId: number): Promise<EmployerCandidateMessage[]> {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/employer-chat`, {
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch employer-candidate messages")
    }

    const data = await response.json()
    return data.messages || []
  }

  async sendEmployerCandidateMessage(
    applicationId: number,
    content: string,
    senderUserId: number
  ): Promise<EmployerCandidateMessage> {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/employer-chat?sender_user_id=${senderUserId}`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({
        application_id: applicationId,
        content,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to send message")
    }

    return response.json()
  }

  async markMessageAsRead(applicationId: number, messageId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/applications/${applicationId}/employer-chat/${messageId}/read`,
      {
        method: "PATCH",
        headers: this.getHeaders(true),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to mark message as read")
    }
  }
}

export const api = new ApiClient()
