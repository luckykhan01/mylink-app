"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api, type Vacancy } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { Loader2, Upload, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vacancy: Vacancy
  userId: number
}

export function ApplicationDialog({ open, onOpenChange, vacancy, userId }: ApplicationDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)

  useEffect(() => {
    if (!open) {
      // Сбрасываем состояние при закрытии диалога
      setApplicationId(null)
      setResumeFile(null)
    }
  }, [open])

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Проверяем размер файла (макс 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: "Максимальный размер файла - 10MB",
          variant: "destructive",
        })
        return
      }
      
      // Проверяем тип файла
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Неподдерживаемый формат",
          description: "Пожалуйста, загрузите PDF, DOC, DOCX или TXT файл",
          variant: "destructive",
        })
        return
      }
      
      setResumeFile(file)
    }
  }

  const removeResume = () => {
    setResumeFile(null)
  }

  const createApplication = async () => {
    setIsCreating(true)
    try {
      const newApplication = await api.createApplication({
        vacancy_id: vacancy.id,
        cover_letter: resumeFile ? `Resume: ${resumeFile.name}` : "",
      })
      setApplicationId(String(newApplication.id))
      console.log('ApplicationDialog: applicationId set to:', String(newApplication.id))
      
      // Если есть резюме, загружаем его
      if (resumeFile) {
        setIsUploadingResume(true)
        try {
          await api.uploadResume(newApplication.id, resumeFile)
          console.log("Resume uploaded successfully:", resumeFile.name)
        } catch (error) {
          console.error("Failed to upload resume:", error)
          toast({
            title: "Предупреждение",
            description: "Не удалось загрузить резюме, но отклик создан. Вы можете загрузить резюме позже.",
            variant: "destructive",
          })
        } finally {
          setIsUploadingResume(false)
        }
      }
      
      // Запускаем AI-анализ после создания заявки
      setTimeout(() => {
        // Это будет обработано в ChatbotWidget через autoStart
      }, 100)
      
      toast({
        title: "Отклик создан!",
        description: "AI-бот SmartBot готов задать вам несколько вопросов о вакансии.",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать отклик. Попробуйте еще раз.",
        variant: "destructive",
      })
      onOpenChange(false)
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartChat = () => {
    createApplication()
  }

  const handleAnalysisComplete = (analysis: any) => {
    toast({
      title: "Интервью завершено!",
      description: "Спасибо за ответы. Работодатель получит уведомление о вашем отклике.",
    })
    if (applicationId) {
      router.push(`/applications/${applicationId}`)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Откликнуться на вакансию</DialogTitle>
          <DialogDescription>
            {vacancy.title} в {vacancy.company}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {isCreating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Создаём ваш отклик...</p>
            </div>
          ) : applicationId ? (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">AI-бот SmartBot</strong> готов задать вам несколько вопросов о вакансии.
                  Это поможет работодателю лучше оценить вашу кандидатуру.
                </p>
              </div>
              {resumeFile && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                      {resumeFile.name}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {(resumeFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}
              <div className="relative h-[500px] border rounded-lg overflow-hidden">
                <ChatbotWidget
                  applicationId={applicationId}
                  vacancyId={String(vacancy.id)}
                  onAnalysisComplete={handleAnalysisComplete}
                  embedded={true}
                  autoStart={true}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">AI-бот SmartBot</strong> поможет вам откликнуться на вакансию. 
                  Вы можете прикрепить резюме (опционально) и начать разговор с ботом.
                </p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="resume-upload" className="text-sm font-medium">
                  Резюме (опционально)
                </Label>
                
                {resumeFile ? (
                  <div className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg bg-muted/30">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resumeFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(resumeFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeResume}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="resume-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Нажмите для загрузки</span> или перетащите файл
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, DOCX или TXT (макс. 10MB)
                      </p>
                    </div>
                    <input
                      id="resume-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleResumeChange}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleStartChat}
                  className="flex-1"
                >
                  Начать разговор с ботом
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
