import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Briefcase, MessageSquare, TrendingUp, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 px-4 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
                Найдите идеальную работу с помощью <span className="text-primary">AI</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                MyLink использует умного чат-бота SmartBot для автоматического анализа откликов и подбора лучших
                кандидатов
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild>
                  <Link href="/vacancies">Найти работу</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/register">Разместить вакансию</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Как это работает</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Найдите вакансию</h3>
                <p className="text-muted-foreground text-sm">
                  Просматривайте тысячи актуальных вакансий от проверенных работодателей
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Откликнитесь</h3>
                <p className="text-muted-foreground text-sm">
                  Отправьте отклик и пообщайтесь с AI-ботом, который задаст уточняющие вопросы
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-chart-3" />
                </div>
                <h3 className="text-xl font-semibold">Получите оценку</h3>
                <p className="text-muted-foreground text-sm">
                  SmartBot автоматически оценит ваше соответствие требованиям вакансии
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-lg bg-chart-4/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-chart-4" />
                </div>
                <h3 className="text-xl font-semibold">Получите ответ</h3>
                <p className="text-muted-foreground text-sm">
                  Работодатель увидит вашу релевантность и свяжется с вами
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Готовы начать?</h2>
            <p className="text-lg opacity-90">
              Присоединяйтесь к тысячам соискателей и работодателей, которые уже используют MyLink
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Создать аккаунт</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link href="/vacancies">Смотреть вакансии</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 MyLink. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}
