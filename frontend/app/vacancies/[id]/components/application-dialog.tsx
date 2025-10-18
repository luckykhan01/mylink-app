"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, type Vacancy } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vacancy: Vacancy
  userId: number
}

export function ApplicationDialog({ open, onOpenChange, vacancy, userId }: ApplicationDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [coverLetter, setCoverLetter] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const newApplication = await api.createApplication(userId, vacancy.id, coverLetter)
      toast({
        title: "Отклик отправлен!",
        description: "Ваш отклик успешно отправлен. Скоро с вами свяжется AI-бот SmartBot.",
      })
      onOpenChange(false)
      router.push(`/applications/${newApplication.id}`)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить отклик. Попробуйте еще раз.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Откликнуться на вакансию</DialogTitle>
          <DialogDescription>
            {vacancy.title} в {vacancy.company}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cover-letter">Сопроводительное письмо (опционально)</Label>
            <Textarea
              id="cover-letter"
              placeholder="Расскажите, почему вы подходите для этой позиции..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              После отправки отклика с вами свяжется AI-бот SmartBot для уточнения деталей
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Отправка..." : "Отправить отклик"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
