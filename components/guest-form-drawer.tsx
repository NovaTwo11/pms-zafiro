"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Save, FileText, ShieldOff, Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

interface Guest {
  id: string
  firstName: string
  lastName: string
  secondLastName: string
  email: string
  phone: string
  nationality: string
  documentType: string
  documentNumber: string
  dateOfBirth: Date
  gender: string
  occupation: string
  address: string
  city: string
  countryOrigin: string
  destinationCity: string
  passportNumber?: string
  entryDate?: Date
  signature?: string
}

interface GuestFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  guest: Guest | null
  isNew: boolean
  isCheckIn?: boolean
}

const nationalities = [
  "Colombia",
  "Estados Unidos",
  "España",
  "Francia",
  "Alemania",
  "Brasil",
  "Argentina",
  "México",
  "Chile",
  "Perú",
  "Ecuador",
  "Venezuela",
  "Canadá",
  "Italia",
  "Reino Unido",
  "Otro",
]

const occupations = [
  "Empleado",
  "Independiente",
  "Empresario",
  "Estudiante",
  "Jubilado",
  "Profesional",
  "Comerciante",
  "Turista",
  "Otro",
]

export function GuestFormDrawer({ isOpen, onClose, guest, isNew, isCheckIn = false }: GuestFormDrawerProps) {
  const [nationality, setNationality] = useState("Colombia")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    secondLastName: "",
    email: "",
    phone: "",
    documentType: "CC",
    documentNumber: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    address: "",
    city: "",
    countryOrigin: "Colombia",
    destinationCity: "",
    passportNumber: "",
    entryDate: "",
  })

  useEffect(() => {
    if (guest) {
      setNationality(guest.nationality)
      setFormData({
        firstName: guest.firstName,
        lastName: guest.lastName,
        secondLastName: guest.secondLastName || "",
        email: guest.email,
        phone: guest.phone,
        documentType: guest.documentType,
        documentNumber: guest.documentNumber,
        dateOfBirth: guest.dateOfBirth.toISOString().split("T")[0],
        gender: guest.gender || "",
        occupation: guest.occupation || "",
        address: guest.address || "",
        city: guest.city || "",
        countryOrigin: guest.countryOrigin || "Colombia",
        destinationCity: guest.destinationCity || "",
        passportNumber: guest.passportNumber || "",
        entryDate: guest.entryDate ? guest.entryDate.toISOString().split("T")[0] : "",
      })
    } else {
      setNationality("Colombia")
      setFormData({
        firstName: "",
        lastName: "",
        secondLastName: "",
        email: "",
        phone: "",
        documentType: "CC",
        documentNumber: "",
        dateOfBirth: "",
        gender: "",
        occupation: "",
        address: "",
        city: "",
        countryOrigin: "Colombia",
        destinationCity: "",
        passportNumber: "",
        entryDate: "",
      })
    }
  }, [guest, isOpen])

  // Canvas signature handling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas background
    ctx.fillStyle = "#0F0F0F"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "#D4AF37"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
  }, [isOpen])

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
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#0F0F0F"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const isForeigner = nationality !== "Colombia"

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-[600px] bg-card border-l border-border p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-[family-name:var(--font-heading)] text-2xl text-foreground">
              {isCheckIn ? "Check-in - Registro de Huésped" : isNew ? "Nuevo Huésped" : "Editar Huésped"}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form className="space-y-6">
            {/* Personal Info - Datos Básicos */}
            <div>
              <h3 className="text-sm font-medium text-[#D4AF37] mb-4">Datos Básicos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nombre *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">1er Apellido *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">2do Apellido</Label>
                  <Input
                    value={formData.secondLastName}
                    onChange={(e) => setFormData({ ...formData, secondLastName: e.target.value })}
                    className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Género *</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="M" className="text-foreground focus:bg-accent">
                        Masculino
                      </SelectItem>
                      <SelectItem value="F" className="text-foreground focus:bg-accent">
                        Femenino
                      </SelectItem>
                      <SelectItem value="O" className="text-foreground focus:bg-accent">
                        Otro
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Fecha de Nacimiento *</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Ocupación *</Label>
                  <Select
                    value={formData.occupation}
                    onValueChange={(v) => setFormData({ ...formData, occupation: v })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {occupations.map((o) => (
                        <SelectItem key={o} value={o} className="text-foreground focus:bg-accent">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-[#333333]" />

            {/* Contacto */}
            <div>
              <h3 className="text-sm font-medium text-[#D4AF37] mb-4">Contacto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Teléfono *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+57 300 123 4567"
                    className="bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label className="text-muted-foreground">Dirección de Residencia *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle, número, barrio"
                  className="bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Ciudad de Residencia *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">País de Origen *</Label>
                  <Select
                    value={formData.countryOrigin}
                    onValueChange={(v) => setFormData({ ...formData, countryOrigin: v })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {nationalities.map((n) => (
                        <SelectItem key={n} value={n} className="text-foreground focus:bg-accent">
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-[#333333]" />

            {/* Legal - Documentación */}
            <div>
              <h3 className="text-sm font-medium text-[#D4AF37] mb-4">Documentación Legal</h3>

              <div className="space-y-2 mb-4">
                <Label className="text-muted-foreground">Nacionalidad *</Label>
                <Select value={nationality} onValueChange={setNationality}>
                  <SelectTrigger className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {nationalities.map((n) => (
                      <SelectItem key={n} value={n} className="text-foreground focus:bg-accent">
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Tipo de Documento *</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(v) => setFormData({ ...formData, documentType: v })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="CC" className="text-foreground focus:bg-accent">
                        Cédula de Ciudadanía
                      </SelectItem>
                      <SelectItem value="CE" className="text-foreground focus:bg-accent">
                        Cédula de Extranjería
                      </SelectItem>
                      <SelectItem value="Pasaporte" className="text-foreground focus:bg-accent">
                        Pasaporte
                      </SelectItem>
                      <SelectItem value="TI" className="text-foreground focus:bg-accent">
                        Tarjeta de Identidad
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Número de Documento *</Label>
                  <Input
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
              </div>

              {/* SIRE fields for foreigners */}
              {isForeigner && (
                <div className="mt-4 p-4 rounded-lg border border-[#D4AF37]/30 bg-primary/5">
                  <p className="text-xs text-[#D4AF37] font-medium mb-3">
                    Campos obligatorios SIRE (Migración Colombia)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Número de Pasaporte *</Label>
                      <Input
                        value={formData.passportNumber}
                        onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                        className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Fecha Entrada al País *</Label>
                      <Input
                        type="date"
                        value={formData.entryDate}
                        onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                        className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-[#333333]" />

            {/* Viaje */}
            <div>
              <h3 className="text-sm font-medium text-[#D4AF37] mb-4">Información de Viaje</h3>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Ciudad de Destino *</Label>
                <Input
                  value={formData.destinationCity}
                  onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                  placeholder="Ciudad de destino final del viaje"
                  className="bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Digital Signature - Only for Check-in */}
            {isCheckIn && (
              <>
                <Separator className="bg-[#333333]" />
                <div>
                  <h3 className="text-sm font-medium text-[#D4AF37] mb-4">Firma Digital del Huésped</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    El huésped debe firmar en el área de abajo usando el dedo o stylus
                  </p>
                  <div className="relative rounded-lg border border-border overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      className="w-full touch-none cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!hasSignature && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[#666666] text-sm">Firme aquí</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="mt-2 border-border text-muted-foreground hover:bg-accent bg-transparent transition-all duration-300"
                  >
                    <Eraser className="h-4 w-4 mr-2" />
                    Borrar Firma
                  </Button>
                </div>
              </>
            )}

            {/* Legal Actions - Only for existing guests */}
            {!isNew && !isCheckIn && (
              <>
                <Separator className="bg-[#333333]" />
                <div>
                  <h3 className="text-sm font-medium text-[#D4AF37] mb-4">Acciones Legales</h3>
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start border-border bg-background text-foreground hover:bg-accent transition-all duration-300"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generar Contrato de Hospedaje
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start border-[#CF6679]/30 bg-[#CF6679]/5 text-[#CF6679] hover:bg-[#CF6679]/10 transition-all duration-300"
                    >
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Anonimizar Datos (Ley 1581)
                    </Button>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border bg-card flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border text-foreground hover:bg-accent bg-transparent transition-all duration-300"
          >
            Cancelar
          </Button>
          <Button className="flex-1 bg-primary text-[#0F0F0F] hover:bg-primary/90 transition-all duration-300">
            <Save className="h-4 w-4 mr-2" />
            {isCheckIn ? "Completar Check-in" : isNew ? "Crear Huésped" : "Guardar Cambios"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
