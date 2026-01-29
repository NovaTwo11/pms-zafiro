"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { X, ChevronRight, ChevronLeft, User, Users, PenTool, Plus, Trash2, Check } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Companion {
  id: string
  name: string
  document: string
  birthDate: string
}

interface CheckinWizardProps {
  isOpen: boolean
  onClose: () => void
  reservation: {
    id: string
    guestName: string
    roomNumber: string
    checkIn: Date
    checkOut: Date
  }
  onComplete: (data: {
    mainGuest: Record<string, string>
    companions: Companion[]
    signature: string
  }) => void
}

const countries = [
  "Colombia",
  "Argentina",
  "Brasil",
  "Chile",
  "Ecuador",
  "Estados Unidos",
  "España",
  "Francia",
  "Alemania",
  "Italia",
  "México",
  "Perú",
  "Venezuela",
]

const documentTypes = [
  { value: "cc", label: "Cédula de Ciudadanía" },
  { value: "ce", label: "Cédula de Extranjería" },
  { value: "passport", label: "Pasaporte" },
  { value: "ti", label: "Tarjeta de Identidad" },
]

const occupations = ["Empleado", "Independiente", "Empresario", "Estudiante", "Jubilado", "Otro"]

export function CheckinWizard({ isOpen, onClose, reservation, onComplete }: CheckinWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [mainGuest, setMainGuest] = useState({
    nationality: "",
    documentType: "",
    documentNumber: "",
    birthDate: "",
    firstName: "",
    lastName1: "",
    lastName2: "",
    gender: "",
    phone: "",
    email: "",
    occupation: "",
    address: "",
    originCity: "",
    destinationCity: "",
  })
  const [companions, setCompanions] = useState<Companion[]>([])
  const [signature, setSignature] = useState<string>("")

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Validation
  const isStep1Valid = () => {
    return (
      mainGuest.nationality &&
      mainGuest.documentType &&
      mainGuest.documentNumber &&
      mainGuest.birthDate &&
      mainGuest.firstName &&
      mainGuest.lastName1 &&
      mainGuest.gender &&
      mainGuest.phone &&
      mainGuest.email &&
      mainGuest.occupation &&
      mainGuest.address &&
      mainGuest.originCity &&
      mainGuest.destinationCity
    )
  }

  const isStep3Valid = () => signature.length > 0

  // Signature canvas handlers
  useEffect(() => {
    if (currentStep === 3 && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#0F0F0F"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = "#D4AF37"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
      }
    }
  }, [currentStep])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    // Save signature as base64
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL())
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#0F0F0F"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setSignature("")
  }

  const addCompanion = () => {
    setCompanions([...companions, { id: Date.now().toString(), name: "", document: "", birthDate: "" }])
  }

  const updateCompanion = (id: string, field: keyof Companion, value: string) => {
    setCompanions(companions.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const removeCompanion = (id: string) => {
    setCompanions(companions.filter((c) => c.id !== id))
  }

  const handleComplete = () => {
    onComplete({ mainGuest, companions, signature })
  }

  const steps = [
    { number: 1, title: "Huésped Principal", icon: User },
    { number: 2, title: "Acompañantes", icon: Users },
    { number: 3, title: "Firma Digital", icon: PenTool },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-[#0F0F0F] border-[#333333] p-0">
        {/* Header */}
        <div className="p-6 border-b border-[#333333]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#E5E5E5]">
                Check-in Wizard
              </h2>
              <p className="text-sm text-[#A3A3A3] mt-1">
                Hab. {reservation.roomNumber} - {reservation.guestName} |
                {format(reservation.checkIn, " dd MMM", { locale: es })} -
                {format(reservation.checkOut, " dd MMM yyyy", { locale: es })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#252525]"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center mt-6 gap-4">
            {steps.map((step, idx) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number

              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                        isActive
                          ? "bg-[#D4AF37] text-[#0F0F0F]"
                          : isCompleted
                            ? "bg-[#059669] text-white"
                            : "bg-[#1A1A1A] text-[#A3A3A3] border border-[#333333]",
                      )}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium hidden sm:block",
                        isActive ? "text-[#D4AF37]" : isCompleted ? "text-[#059669]" : "text-[#A3A3A3]",
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={cn("w-12 h-0.5 mx-2", currentStep > step.number ? "bg-[#059669]" : "bg-[#333333]")}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {/* Step 1: Main Guest */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5]">
                Datos del Huésped Principal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Nacionalidad *</Label>
                  <Select
                    value={mainGuest.nationality}
                    onValueChange={(v) => setMainGuest({ ...mainGuest, nationality: v })}
                  >
                    <SelectTrigger className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                      {countries.map((c) => (
                        <SelectItem key={c} value={c} className="text-[#E5E5E5] focus:bg-[#252525]">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Tipo de Documento *</Label>
                  <Select
                    value={mainGuest.documentType}
                    onValueChange={(v) => setMainGuest({ ...mainGuest, documentType: v })}
                  >
                    <SelectTrigger className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                      {documentTypes.map((d) => (
                        <SelectItem key={d.value} value={d.value} className="text-[#E5E5E5] focus:bg-[#252525]">
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Número de Documento *</Label>
                  <Input
                    value={mainGuest.documentNumber}
                    onChange={(e) => setMainGuest({ ...mainGuest, documentNumber: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Fecha de Nacimiento *</Label>
                  <Input
                    type="date"
                    value={mainGuest.birthDate}
                    onChange={(e) => setMainGuest({ ...mainGuest, birthDate: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Nombre *</Label>
                  <Input
                    value={mainGuest.firstName}
                    onChange={(e) => setMainGuest({ ...mainGuest, firstName: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Primer Apellido *</Label>
                  <Input
                    value={mainGuest.lastName1}
                    onChange={(e) => setMainGuest({ ...mainGuest, lastName1: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Segundo Apellido</Label>
                  <Input
                    value={mainGuest.lastName2}
                    onChange={(e) => setMainGuest({ ...mainGuest, lastName2: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Género *</Label>
                  <Select value={mainGuest.gender} onValueChange={(v) => setMainGuest({ ...mainGuest, gender: v })}>
                    <SelectTrigger className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                      <SelectItem value="M" className="text-[#E5E5E5] focus:bg-[#252525]">
                        Masculino
                      </SelectItem>
                      <SelectItem value="F" className="text-[#E5E5E5] focus:bg-[#252525]">
                        Femenino
                      </SelectItem>
                      <SelectItem value="O" className="text-[#E5E5E5] focus:bg-[#252525]">
                        Otro
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Teléfono *</Label>
                  <Input
                    type="tel"
                    value={mainGuest.phone}
                    onChange={(e) => setMainGuest({ ...mainGuest, phone: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Email *</Label>
                  <Input
                    type="email"
                    value={mainGuest.email}
                    onChange={(e) => setMainGuest({ ...mainGuest, email: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Ocupación *</Label>
                  <Select
                    value={mainGuest.occupation}
                    onValueChange={(v) => setMainGuest({ ...mainGuest, occupation: v })}
                  >
                    <SelectTrigger className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                      {occupations.map((o) => (
                        <SelectItem key={o} value={o} className="text-[#E5E5E5] focus:bg-[#252525]">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[#A3A3A3]">Dirección de Residencia *</Label>
                  <Input
                    value={mainGuest.address}
                    onChange={(e) => setMainGuest({ ...mainGuest, address: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Ciudad de Origen *</Label>
                  <Input
                    value={mainGuest.originCity}
                    onChange={(e) => setMainGuest({ ...mainGuest, originCity: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Ciudad de Destino *</Label>
                  <Input
                    value={mainGuest.destinationCity}
                    onChange={(e) => setMainGuest({ ...mainGuest, destinationCity: e.target.value })}
                    className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Companions */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5]">Acompañantes</h3>
                <Button onClick={addCompanion} className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Acompañante
                </Button>
              </div>

              {companions.length === 0 ? (
                <div className="text-center py-12 text-[#A3A3A3]">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay acompañantes registrados</p>
                  <p className="text-sm mt-1">Haga clic en "Agregar Acompañante" para añadir uno</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {companions.map((companion, idx) => (
                    <div key={companion.id} className="p-4 rounded-lg border border-[#333333] bg-[#1A1A1A]">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-[#E5E5E5]">Acompañante {idx + 1}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCompanion(companion.id)}
                          className="h-8 w-8 text-[#CF6679] hover:text-[#CF6679] hover:bg-[#CF6679]/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#A3A3A3]">Nombre Completo *</Label>
                          <Input
                            value={companion.name}
                            onChange={(e) => updateCompanion(companion.id, "name", e.target.value)}
                            className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#A3A3A3]">Documento *</Label>
                          <Input
                            value={companion.document}
                            onChange={(e) => updateCompanion(companion.id, "document", e.target.value)}
                            className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#A3A3A3]">Fecha de Nacimiento *</Label>
                          <Input
                            type="date"
                            value={companion.birthDate}
                            onChange={(e) => updateCompanion(companion.id, "birthDate", e.target.value)}
                            className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Digital Signature */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5]">
                Firma Digital del Huésped
              </h3>
              <p className="text-sm text-[#A3A3A3]">Por favor firme en el recuadro usando el dedo o un lápiz táctil</p>

              <div className="flex flex-col items-center">
                <div className="relative rounded-lg border-2 border-[#D4AF37] overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={clearSignature}
                    className="border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent"
                  >
                    Limpiar
                  </Button>
                  {signature && (
                    <div className="flex items-center gap-2 text-[#059669]">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Firma capturada</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#333333]">
                <p className="text-xs text-[#A3A3A3]">
                  Al firmar, el huésped acepta los términos y condiciones del hotel, incluyendo las políticas de
                  cancelación, uso de instalaciones y tratamiento de datos personales según la Ley 1581 de 2012.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#333333] flex justify-between">
          <Button
            variant="outline"
            onClick={() => (currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose())}
            className="border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? "Cancelar" : "Anterior"}
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === 1 && !isStep1Valid()}
              className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 disabled:opacity-50"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!isStep3Valid()}
              className="bg-[#059669] text-white hover:bg-[#059669]/90 disabled:opacity-50"
            >
              <Check className="h-4 w-4 mr-2" />
              Completar Check-in
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
