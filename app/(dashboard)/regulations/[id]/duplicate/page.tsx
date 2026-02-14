'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { PageHeader, FormSkeleton } from '@/components/shared'
import { Step1Content } from '../../components/step1-content'
import { Step2Content } from '../../components/step2-content'
import { Step3Content } from '../../components/step3-content'
import { Step4Summary } from '../../components/step4-summary'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatCPF, formatPhone } from '@/lib/format'
import { format } from 'date-fns'

interface Citizen {
  id: string
  name: string
  cpf: string
  birthDate: string
  phone: string
}

interface SelectedCare {
  careId: number
  name: string
  acronym?: string | null
  quantity: number
  unitMeasure?: string | null
  priority?: string | null
  resourceOrigin?: string | null
  userId?: string | null
  supplierId?: number | null
  templateId?: number | null
}

interface Step2Data {
  requestingProfessional: string
  requestDate: string
  notes: string
  clinicalIndication: string
  cid: string
  cares: SelectedCare[]
}

interface Step3Data {
  status: string
  folderId?: string
  priority: string
  templateId?: string
  analyzerId?: string
  supplierId?: string
  resourceOrigin?: string
}

interface RegulationDocument {
  id: string
  file: File
  name: string
  size: number
  type: string
  tag?: string
}

const steps = [
  { number: 1, title: 'Cidadao' },
  { number: 2, title: 'Solicitacao' },
  { number: 3, title: 'Documentos' },
  { number: 4, title: 'Revisao' },
]

const today = new Date().toISOString().split('T')[0]

const mostFrequent = <T extends string | number>(values: Array<T | null | undefined>): T | null => {
  const counts = new Map<string, { value: T; count: number }>()
  values.forEach((value) => {
    if (value === null || value === undefined) return
    const key = String(value)
    const current = counts.get(key)
    if (current) {
      current.count += 1
    } else {
      counts.set(key, { value, count: 1 })
    }
  })
  let winner: { value: T; count: number } | null = null
  counts.forEach((entry) => {
    if (!winner || entry.count > winner.count) {
      winner = entry
    }
  })
  return winner ? (winner as { value: T; count: number }).value : null
}

const formatCitizen = (raw: any): Citizen => ({
  id: String(raw.id),
  name: raw.name,
  cpf: raw.cpf ? formatCPF(raw.cpf) : '',
  birthDate: raw.birthDate ? format(new Date(raw.birthDate), 'dd/MM/yyyy') : '',
  phone: raw.phone ? formatPhone(raw.phone) : 'Nao informado',
})

const toDateInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

export default function DuplicateRegulationPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const regulationId = Array.isArray(params.id) ? params.id[0] : params.id
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [selectedResponsible, setSelectedResponsible] = useState<Citizen | null>(null)
  const [relationship, setRelationship] = useState<string | null>(null)

  const [step2Data, setStep2Data] = useState<Step2Data>({
    requestingProfessional: '',
    requestDate: today,
    notes: '',
    clinicalIndication: '',
    cid: '',
    cares: [],
  })

  const [step3Data, setStep3Data] = useState<Step3Data>({
    status: 'IN_PROGRESS',
    priority: 'ELECTIVE',
    folderId: '',
    templateId: '',
    analyzerId: '',
    supplierId: '',
    resourceOrigin: '',
  })

  const [documents, setDocuments] = useState<RegulationDocument[]>([])
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  const progress = (currentStep / steps.length) * 100

  useEffect(() => {
    const fetchRegulation = async () => {
      setIsFetching(true)
      try {
        const response = await fetch(`/api/regulations/${regulationId}`)
        if (!response.ok) throw new Error('Erro ao carregar regulacao')
        const data = await response.json()

        if (data.citizen) {
          setSelectedCitizen(formatCitizen(data.citizen))
        }

        if (data.responsible) {
          setSelectedResponsible(formatCitizen(data.responsible))
        }

        setRelationship(data.relationship || null)

        setStep2Data({
          requestingProfessional: data.requestingProfessional || '',
          requestDate: toDateInput(data.requestDate) || today,
          notes: data.notes ? `Copia da regulacao anterior. ${data.notes}` : '',
          clinicalIndication: data.clinicalIndication || '',
          cid: data.cid || '',
          cares: Array.isArray(data.cares)
            ? data.cares.map((item: any) => ({
                careId: item.careId,
                name: item.care?.name || '',
                acronym: item.care?.acronym || null,
                quantity: item.quantity || 1,
                unitMeasure: item.care?.unitMeasure || null,
                priority: item.care?.priority || null,
                resourceOrigin: item.care?.resourceOrigin || null,
                userId: item.care?.userId || null,
                supplierId: item.care?.supplierId || null,
                templateId: item.care?.templateId || null,
              }))
            : [],
        })

        setStep3Data({
          status: data.status || 'IN_PROGRESS',
          priority: data.priority || 'ELECTIVE',
          folderId: data.folderId ? String(data.folderId) : '',
          templateId: data.templateId ? String(data.templateId) : '',
          analyzerId: data.analyzerId || '',
          supplierId: data.supplierId ? String(data.supplierId) : '',
          resourceOrigin: '',
        })

        setTouchedFields({
          priority: true,
          resourceOrigin: true,
          analyzerId: true,
          supplierId: true,
          templateId: true,
        })
      } catch (error) {
        console.error('Erro ao carregar regulacao:', error)
        toast.error('Erro ao carregar regulacao')
        router.push('/regulations')
      } finally {
        setIsFetching(false)
      }
    }

    if (regulationId) {
      fetchRegulation()
    }
  }, [regulationId, router])

  const autoFill = useMemo(() => {
    if (!step2Data.cares.length) {
      return {}
    }

    const hasEmergency = step2Data.cares.some((care) => care.priority === 'EMERGENCY')
    const hasUrgency = step2Data.cares.some((care) => care.priority === 'URGENCY')
    const hasElective = step2Data.cares.some((care) => care.priority === 'ELECTIVE')

    const priority = hasEmergency
      ? 'EMERGENCY'
      : hasUrgency
      ? 'URGENCY'
      : hasElective
      ? 'ELECTIVE'
      : ''

    const resourceOrigin = step2Data.cares.some((care) => care.resourceOrigin === 'MUNICIPAL')
      ? 'MUNICIPAL'
      : step2Data.cares.some((care) => care.resourceOrigin === 'NOT_SPECIFIED')
      ? 'NOT_SPECIFIED'
      : step2Data.cares.some((care) => care.resourceOrigin === 'FEDERAL')
      ? 'FEDERAL'
      : step2Data.cares.some((care) => care.resourceOrigin === 'STATE')
      ? 'STATE'
      : ''

    return {
      priority,
      resourceOrigin,
      analyzerId: mostFrequent(step2Data.cares.map((care) => care.userId)) || '',
      supplierId: mostFrequent(step2Data.cares.map((care) => care.supplierId))?.toString() || '',
      templateId: mostFrequent(step2Data.cares.map((care) => care.templateId))?.toString() || '',
    }
  }, [step2Data.cares])

  useEffect(() => {
    setStep3Data((prev) => ({
      ...prev,
      priority: touchedFields.priority ? prev.priority : (autoFill.priority || prev.priority),
      resourceOrigin: touchedFields.resourceOrigin ? prev.resourceOrigin : (autoFill.resourceOrigin || prev.resourceOrigin),
      analyzerId: touchedFields.analyzerId ? prev.analyzerId : (autoFill.analyzerId || prev.analyzerId),
      supplierId: touchedFields.supplierId ? prev.supplierId : (autoFill.supplierId || prev.supplierId),
      templateId: touchedFields.templateId ? prev.templateId : (autoFill.templateId || prev.templateId),
    }))
  }, [autoFill, touchedFields])

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedCitizen
      case 2:
        return step2Data.cares.length > 0
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStep3FieldChange = (field: keyof Step3Data, value: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }))
    setStep3Data((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!selectedCitizen) {
      toast.error('Selecione um cidadao')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        citizenId: parseInt(selectedCitizen.id),
        responsibleId: selectedResponsible ? parseInt(selectedResponsible.id) : undefined,
        relationship: relationship || undefined,
        requestDate: step2Data.requestDate || undefined,
        requestingProfessional: step2Data.requestingProfessional || undefined,
        notes: step2Data.notes || undefined,
        clinicalIndication: step2Data.clinicalIndication || undefined,
        cid: step2Data.cid || undefined,
        status: step3Data.status || undefined,
        folderId: step3Data.folderId ? parseInt(step3Data.folderId) : undefined,
        priority: step3Data.priority || undefined,
        templateId: step3Data.templateId ? parseInt(step3Data.templateId) : undefined,
        analyzerId: step3Data.analyzerId || undefined,
        supplierId: step3Data.supplierId ? parseInt(step3Data.supplierId) : undefined,
        cares: step2Data.cares.map((care) => ({
          careId: care.careId,
          quantity: care.quantity,
        })),
      }

      const response = await fetch('/api/regulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Erro ao duplicar regulacao')
      const regulation = await response.json()

      if (documents.length) {
        const failures: string[] = []
        await Promise.all(
          documents.map(async (doc) => {
            try {
              const formData = new FormData()
              formData.append('file', doc.file)
              if (doc.tag) formData.append('tag', doc.tag)

              const uploadResponse = await fetch(`/api/regulations/${regulation.id}/attachments`, {
                method: 'POST',
                body: formData,
              })

              if (!uploadResponse.ok) {
                failures.push(doc.name)
              }
            } catch {
              failures.push(doc.name)
            }
          })
        )

        if (failures.length) {
          toast.error(`Falha ao enviar documentos: ${failures.join(', ')}`)
        }
      }

      toast.success('Regulacao criada com sucesso (Duplicada)!')
      router.push('/regulations')
    } catch (error) {
      console.error('Erro ao duplicar regulacao:', error)
      toast.error('Erro ao duplicar regulacao')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Duplicar Regulacao"
          description="Carregando dados..."
          backHref="/regulations"
        />
        <FormSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Duplicar Regulacao"
        description={`Crie uma nova regulacao baseada na existente em ${steps.length} etapas`}
        backHref="/regulations"
      />

      <div className="space-y-4">
        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step.number}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                currentStep >= step.number
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              )}
              onClick={() => step.number < currentStep && setCurrentStep(step.number)}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm',
                  currentStep > step.number
                    ? 'bg-primary text-white'
                    : currentStep === step.number
                    ? 'bg-primary text-white'
                    : 'bg-muted'
                )}
              >
                {currentStep > step.number ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              <span className="hidden sm:inline text-sm">{step.title}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Etapa {currentStep}: {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <Step1Content
              selectedCitizen={selectedCitizen}
              onCitizenSelect={setSelectedCitizen}
              selectedResponsible={selectedResponsible}
              onResponsibleSelect={setSelectedResponsible}
              relationship={relationship}
              onRelationshipChange={setRelationship}
              onAdvance={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 2 && (
            <Step2Content
              data={step2Data}
              onChange={setStep2Data}
              citizenId={selectedCitizen?.id}
            />
          )}
          {currentStep === 3 && (
            <Step3Content
              data={step3Data}
              onFieldChange={handleStep3FieldChange}
              documents={documents}
              onDocumentsChange={setDocuments}
              subscriberId={session?.user?.subscriberId}
            />
          )}
          {currentStep === 4 && (
            <Step4Summary
              citizen={selectedCitizen}
              responsible={selectedResponsible}
              relationship={relationship}
              step2Data={step2Data}
              step3Data={step3Data}
              documents={documents}
              onEditStep={setCurrentStep}
              subscriberId={session?.user?.subscriberId}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Proximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Criar Nova Regulacao
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
