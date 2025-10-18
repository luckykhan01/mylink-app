"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Briefcase, User } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Briefcase className="h-6 w-6 text-primary" />
          <span>MyLink</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/vacancies" className="text-sm font-medium hover:text-primary transition-colors">
            Вакансии
          </Link>

          {user ? (
            <>
              {user.role === "employer" && (
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Дашборд
                </Link>
              )}
              {user.role === "seeker" && (
                <Link href="/applications" className="text-sm font-medium hover:text-primary transition-colors">
                  Мои отклики
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.full_name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Выйти</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
