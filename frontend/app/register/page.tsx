"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "seeker" as "employer" | "seeker",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const user = await api.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role === "seeker" ? "job_seeker" : formData.role,
      })
      const loginResponse = await api.login(formData.email, formData.password)
      setUser(loginResponse.user)

      if (user.role === "employer") {
        router.push("/dashboard")
      } else {
        router.push("/vacancies")
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Ошибка регистрации"
      if (errorMessage.includes("already exists")) {
        setError("Этот email уже зарегистрирован. Попробуйте другой или войдите в систему.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Регистрация</CardTitle>
            <CardDescription>Создайте аккаунт для доступа к MyLink</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Демо-версия: данные хранятся в памяти и сбрасываются при обновлении страницы
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Полное имя</Label>
                <Input
                  id="full_name"
                  placeholder="Иван Иванов"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон (опционально)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7-999-123-45-67"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Я хочу</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as "employer" | "seeker" })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="seeker" id="seeker" />
                    <Label htmlFor="seeker" className="font-normal cursor-pointer">
                      Искать работу
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="employer" id="employer" />
                    <Label htmlFor="employer" className="font-normal cursor-pointer">
                      Нанимать сотрудников
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Войти
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
