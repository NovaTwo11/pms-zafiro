"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  X, ChevronRight, ChevronLeft, User, Users,
  PenTool, Plus, Trash2, Check, AlertTriangle,
  CreditCard, DollarSign, Wallet
} from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// --- INTERFACES ---
interface GuestFormData {
  id: string
  nacionalidad: string
  tipoId: string
  numeroId: string
  fechaCumpleanos: string
  primerNombre: string
  primerApellido: string
  segundoNombre?: string
  segundoApellido?: string
  genero: string
  telefono: string
  correo?: string
  ocupacion?: string
  direccion?: string
  ciudadOrigen?: string
  ciudadDestino?: string
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
    totalAmount: number
    paidAmount: number
  }
  onComplete: (data: {
    mainGuest: GuestFormData
    companions: GuestFormData[]
    signature: string
    legalAccepted: boolean
    newPaidAmount: number
  }) => void
}

const countries = ["Colombia", "Estados Unidos", "España", "México", "Argentina", "Brasil", "Chile", "Perú", "Ecuador", "Venezuela"]
const documentTypes = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PA", label: "Pasaporte" },
  { value: "TI", label: "Tarjeta de Identidad" },
  { value: "RC", label: "Registro Civil" },
]
const occupations = ["Empleado", "Independiente", "Empresario", "Estudiante", "Jubilado", "Turista", "Otro"]

export function CheckinWizard({ isOpen, onClose, reservation, onComplete }: CheckinWizardProps) {
  // --- ESTADOS FINANCIEROS ---
  const [localPaidAmount, setLocalPaidAmount] = useState(reservation.paidAmount)
  const pendingAmount = reservation.totalAmount - localPaidAmount
  const hasDebt = pendingAmount > 0

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("efectivo")

  // --- ESTADOS DEL WIZARD ---
  const [currentStep, setCurrentStep] = useState(hasDebt ? 0 : 1)

  const [mainGuest, setMainGuest] = useState<GuestFormData>({
    id: "main",
    nacionalidad: "Colombia",
    tipoId: "CC",
    numeroId: "",
    fechaCumpleanos: "",
    primerNombre: "",
    primerApellido: "",
    segundoNombre: "",
    segundoApellido: "",
    genero: "",
    telefono: "",
    correo: "",
    ocupacion: "",
    direccion: "",
    ciudadOrigen: "",
    ciudadDestino: ""
  })

  const [companions, setCompanions] = useState<GuestFormData[]>([])
  const [signature, setSignature] = useState<string>("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [dataPolicyAccepted, setDataPolicyAccepted] = useState(false)

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // --- VALIDACIONES ---
  const isMainGuestValid = () => {
    return (
        mainGuest.nacionalidad &&
        mainGuest.tipoId &&
        mainGuest.numeroId &&
        mainGuest.fechaCumpleanos &&
        mainGuest.primerNombre &&
        mainGuest.primerApellido &&
        mainGuest.genero &&
        mainGuest.telefono &&
        mainGuest.correo &&
        mainGuest.ocupacion &&
        mainGuest.direccion &&
        mainGuest.ciudadOrigen &&
        mainGuest.ciudadDestino
    )
  }

  const areCompanionsValid = () => {
    if (companions.length === 0) return true;
    return companions.every(c =>
        c.nacionalidad && c.tipoId && c.numeroId && c.fechaCumpleanos &&
        c.primerNombre && c.primerApellido && c.genero && c.telefono
    )
  }

  const isStep3Valid = () => signature.length > 0 && termsAccepted && dataPolicyAccepted

  // --- HANDLERS ---
  const handleOpenPayment = () => {
    setPaymentAmount(pendingAmount.toString())
    setIsPaymentModalOpen(true)
  }

  const handleRegisterPayment = () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) return
    const newPaid = localPaidAmount + amount
    setLocalPaidAmount(newPaid)
    setIsPaymentModalOpen(false)
    if (reservation.totalAmount - newPaid <= 0) setCurrentStep(1)
  }

  const addCompanion = () => {
    setCompanions([...companions, {
      id: Date.now().toString(),
      nacionalidad: "Colombia",
      tipoId: "CC",
      numeroId: "",
      fechaCumpleanos: "",
      primerNombre: "",
      primerApellido: "",
      genero: "",
      telefono: ""
    }])
  }

  const updateCompanion = (id: string, field: keyof GuestFormData, value: string) => {
    setCompanions(companions.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  // --- CANVAS HANDLERS ---
  useEffect(() => {
    if (currentStep === 3 && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#0F0F0F"; ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = "#D4AF37"; ctx.lineWidth = 3; ctx.lineCap = "round" // LineWidth aumentado a 3 para mejor visibilidad
      }
    }
  }, [currentStep])

  const startDrawing = (e: any) => {
    setIsDrawing(true)
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext("2d"); if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    // Ajuste de escala por si el canvas visual no coincide con los píxeles internos
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY

    ctx.beginPath(); ctx.moveTo(x, y)
  }

  const draw = (e: any) => {
    if (!isDrawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext("2d"); if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY

    ctx.lineTo(x, y); ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current) setSignature(canvasRef.current.toDataURL())
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#0F0F0F"; ctx.fillRect(0, 0, canvas.width, canvas.height)
    setSignature("")
  }

  const handleComplete = () => {
    onComplete({ mainGuest, companions, signature, legalAccepted: true, newPaidAmount: localPaidAmount })
  }

  const steps = [
    { number: 0, title: "Pagos", icon: CreditCard, hidden: !hasDebt },
    { number: 1, title: "Titular", icon: User, hidden: false },
    { number: 2, title: "Acompañantes", icon: Users, hidden: false },
    { number: 3, title: "Firma", icon: PenTool, hidden: false },
  ].filter(s => !s.hidden)

  return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        {/* MODIFICACIÓN: Ancho aumentado a max-w-[90vw] y altura máxima relajada */}
        <DialogContent className="w-full max-w-[95vw] lg:max-w-7xl h-[95vh] flex flex-col p-0 bg-background border-border shadow-2xl">

          {/* Header */}
          <div className="bg-[#141414] px-8 py-6 border-b border-border shrink-0">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground font-[family-name:var(--font-heading)]">Check-in Digital</h2>
                <p className="text-muted-foreground text-lg">Habitación {reservation.roomNumber} • {reservation.guestName}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10"><X className="h-6 w-6 text-muted-foreground"/></Button>
            </div>

            {/* Stepper Ampliado */}
            <div className="flex items-center justify-center gap-4">
              {steps.map((step, idx) => {
                const isActive = currentStep === step.number
                const isCompleted = currentStep > step.number
                return (
                    <div key={step.number} className="flex items-center">
                      <div className={cn("flex items-center gap-3 px-6 py-2 rounded-full border transition-all",
                          isActive ? "bg-primary/10 border-[#D4AF37] text-[#D4AF37]" :
                              isCompleted ? "bg-[#059669]/10 border-[#059669] text-[#059669]" : "border-transparent text-[#555]")}>
                        <step.icon className="h-5 w-5" />
                        <span className="text-base font-medium">{step.title}</span>
                      </div>
                      {idx < steps.length - 1 && <div className="w-12 h-px bg-[#333333]" />}
                    </div>
                )
              })}
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8 overflow-y-auto flex-1 bg-background">

            {/* PASO 0: DEUDA */}
            {currentStep === 0 && (
                <div className="flex flex-col items-center justify-center h-full space-y-8">
                  <div className="text-center space-y-4">
                    <Badge variant="outline" className="text-red-400 border-red-900 bg-red-900/10 px-6 py-2 text-lg rounded-full">
                      <AlertTriangle className="h-5 w-5 mr-2" /> Saldo Pendiente Requerido
                    </Badge>
                    <div className="py-4">
                      <h3 className="text-5xl font-bold text-foreground">${pendingAmount.toLocaleString()}</h3>
                      <p className="text-muted-foreground mt-2 text-lg">Debe saldar la cuenta para habilitar el Check-in.</p>
                    </div>
                  </div>

                  <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border space-y-6 shadow-xl">
                    <div className="flex justify-between text-base"><span className="text-[#777]">Total Reserva</span> <span className="text-foreground font-medium">${reservation.totalAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between text-base"><span className="text-[#777]">Abonado</span> <span className="text-green-500 font-medium">${localPaidAmount.toLocaleString()}</span></div>
                    <Button className="w-full h-12 text-lg bg-[#E5E5E5] text-black hover:bg-card font-bold mt-2" onClick={handleOpenPayment}>
                      <Wallet className="h-5 w-5 mr-2" /> Registrar Pago Ahora
                    </Button>
                  </div>
                </div>
            )}

            {/* PASO 1: TITULAR */}
            {currentStep === 1 && (
                <div className="space-y-8 max-w-6xl mx-auto">
                  <h3 className="text-xl font-bold text-[#D4AF37] border-b border-border pb-4">Información del Titular</h3>
                  {/* Grid de 4 columnas en pantallas grandes para aprovechar el ancho */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                    {/* Grupo Identificación */}
                    <div className="space-y-2"><Label className="text-muted-foreground">Nacionalidad *</Label>
                      <Select value={mainGuest.nacionalidad} onValueChange={v => setMainGuest({...mainGuest, nacionalidad: v})}>
                        <SelectTrigger className="bg-card border-border h-11"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-border">{countries.map(c => <SelectItem key={c} value={c} className="text-foreground focus:bg-accent">{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label className="text-muted-foreground">Tipo ID *</Label>
                      <Select value={mainGuest.tipoId} onValueChange={v => setMainGuest({...mainGuest, tipoId: v})}>
                        <SelectTrigger className="bg-card border-border h-11"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-border">{documentTypes.map(d => <SelectItem key={d.value} value={d.value} className="text-foreground focus:bg-accent">{d.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 xl:col-span-2"><Label className="text-muted-foreground">Número ID *</Label>
                      <Input value={mainGuest.numeroId} onChange={e => setMainGuest({...mainGuest, numeroId: e.target.value})} className="bg-card border-border h-11"/>
                    </div>

                    {/* Grupo Nombre */}
                    <div className="space-y-2"><Label className="text-muted-foreground">Primer Nombre *</Label>
                      <Input value={mainGuest.primerNombre} onChange={e => setMainGuest({...mainGuest, primerNombre: e.target.value})} className="bg-card border-border h-11"/>
                    </div>
                    <div className="space-y-2"><Label className="text-muted-foreground">Segundo Nombre</Label>
                      <Input value={mainGuest.segundoNombre} onChange={e => setMainGuest({...mainGuest, segundoNombre: e.target.value})} className="bg-card border-border h-11"/>
                    </div>
                    <div className="space-y-2"><Label className="text-muted-foreground">Primer Apellido *</Label>
                      <Input value={mainGuest.primerApellido} onChange={e => setMainGuest({...mainGuest, primerApellido: e.target.value})} className="bg-card border-border h-11"/>
                    </div>
                    <div className="space-y-2"><Label className="text-muted-foreground">Segundo Apellido</Label>
                      <Input value={mainGuest.segundoApellido} onChange={e => setMainGuest({...mainGuest, segundoApellido: e.target.value})} className="bg-card border-border h-11"/>
                    </div>

                    {/* Grupo Demográfico */}
                    <div className="space-y-2"><Label className="text-muted-foreground">Fecha Nacimiento *</Label>
                      <Input type="date" value={mainGuest.fechaCumpleanos} onChange={e => setMainGuest({...mainGuest, fechaCumpleanos: e.target.value})} className="bg-card border-border h-11 dark:[color-scheme:dark]"/>
                    </div>
                    <div className="space-y-2"><Label className="text-muted-foreground">Género *</Label>
                      <Select value={mainGuest.genero} onValueChange={v => setMainGuest({...mainGuest, genero: v})}>
                        <SelectTrigger className="bg-card border-border h-11"><SelectValue placeholder="Seleccione"/></SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="M" className="text-foreground focus:bg-accent">Masculino</SelectItem>
                          <SelectItem value="F" className="text-foreground focus:bg-accent">Femenino</SelectItem>
                          <SelectItem value="O" className="text-foreground focus:bg-accent">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label className="text-muted-foreground">Teléfono *</Label>
                      <Input type="tel" value={mainGuest.telefono} onChange={e => setMainGuest({...mainGuest, telefono: e.target.value})} className="bg-card border-border h-11"/>
                    </div>
                    <div className="space-y-2"><Label className="text-[#D4AF37]">Correo Electrónico *</Label>
                      <Input type="email" value={mainGuest.correo} onChange={e => setMainGuest({...mainGuest, correo: e.target.value})} className="bg-card border-border h-11"/>
                    </div>

                    {/* Grupo Ubicación */}
                    <div className="space-y-2 xl:col-span-2"><Label className="text-[#D4AF37]">Dirección Residencia *</Label>
                      <Input value={mainGuest.direccion} onChange={e => setMainGuest({...mainGuest, direccion: e.target.value})} className="bg-card border-border h-11"/>
                    </div>
                    <div className="space-y-2"><Label className="text-[#D4AF37]">Ciudad Origen *</Label>
                      <Input value={mainGuest.ciudadOrigen} onChange={e => setMainGuest({...mainGuest, ciudadOrigen: e.target.value})} className="bg-card border-border h-11"/>
                    </div>
                    <div className="space-y-2"><Label className="text-[#D4AF37]">Ciudad Destino *</Label>
                      <Input value={mainGuest.ciudadDestino} onChange={e => setMainGuest({...mainGuest, ciudadDestino: e.target.value})} className="bg-card border-border h-11"/>
                    </div>
                    <div className="space-y-2 xl:col-span-4"><Label className="text-[#D4AF37]">Ocupación *</Label>
                      <Select value={mainGuest.ocupacion} onValueChange={v => setMainGuest({...mainGuest, ocupacion: v})}>
                        <SelectTrigger className="bg-card border-border h-11"><SelectValue placeholder="Seleccione"/></SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {occupations.map(o => <SelectItem key={o} value={o} className="text-foreground focus:bg-accent">{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
            )}

            {/* PASO 2: ACOMPAÑANTES */}
            {currentStep === 2 && (
                <div className="space-y-8 max-w-6xl mx-auto">
                  <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border">
                    <div>
                      <h3 className="text-xl font-bold text-[#D4AF37]">Registro de Acompañantes</h3>
                      <p className="text-[#777]">Ingrese los datos de las personas adicionales en la habitación.</p>
                    </div>
                    <Button onClick={addCompanion} size="lg" className="bg-primary text-black hover:bg-primary/90 font-medium px-6"><Plus className="h-5 w-5 mr-2"/> Agregar Nuevo</Button>
                  </div>

                  <div className="space-y-4">
                    {companions.map((comp, idx) => (
                        <div key={comp.id} className="p-6 bg-[#141414] border border-border rounded-xl relative transition-all hover:border-[#555]">
                          <Button size="icon" variant="ghost" className="absolute top-4 right-4 text-red-500 hover:bg-red-900/20 hover:text-red-400" onClick={() => {
                            setCompanions(companions.filter(c => c.id !== comp.id))
                          }}><Trash2 className="h-5 w-5"/></Button>

                          <Badge variant="outline" className="mb-4 text-[#D4AF37] border-[#D4AF37]/50 text-sm px-3 py-1">Acompañante #{idx+1}</Badge>

                          {/* Grid más amplia para acompañantes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div className="space-y-1"><Label className="text-xs text-[#777]">Nacionalidad *</Label>
                              <Select value={comp.nacionalidad} onValueChange={v => updateCompanion(comp.id, "nacionalidad", v)}>
                                <SelectTrigger className="h-10 bg-background border-border"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-card border-border">{countries.map(c => <SelectItem key={c} value={c} className="text-foreground focus:bg-accent">{c}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1"><Label className="text-xs text-[#777]">No. Documento *</Label>
                              <Input className="h-10 bg-background border-border" value={comp.numeroId} onChange={e => updateCompanion(comp.id, "numeroId", e.target.value)} />
                            </div>
                            <div className="space-y-1"><Label className="text-xs text-[#777]">Primer Nombre *</Label>
                              <Input className="h-10 bg-background border-border" value={comp.primerNombre} onChange={e => updateCompanion(comp.id, "primerNombre", e.target.value)} />
                            </div>
                            <div className="space-y-1"><Label className="text-xs text-[#777]">Primer Apellido *</Label>
                              <Input className="h-10 bg-background border-border" value={comp.primerApellido} onChange={e => updateCompanion(comp.id, "primerApellido", e.target.value)} />
                            </div>

                            <div className="space-y-1"><Label className="text-xs text-[#777]">Fecha Nacimiento *</Label>
                              <Input type="date" className="h-10 bg-background border-border dark:[color-scheme:dark]" value={comp.fechaCumpleanos} onChange={e => updateCompanion(comp.id, "fechaCumpleanos", e.target.value)} />
                            </div>
                            <div className="space-y-1"><Label className="text-xs text-[#777]">Género *</Label>
                              <Select value={comp.genero} onValueChange={v => updateCompanion(comp.id, "genero", v)}>
                                <SelectTrigger className="h-10 bg-background border-border"><SelectValue placeholder="-"/></SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                  <SelectItem value="M" className="text-foreground focus:bg-accent">Masculino</SelectItem>
                                  <SelectItem value="F" className="text-foreground focus:bg-accent">Femenino</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1 md:col-span-2"><Label className="text-xs text-[#777]">Teléfono *</Label>
                              <Input type="tel" className="h-10 bg-background border-border" value={comp.telefono} onChange={e => updateCompanion(comp.id, "telefono", e.target.value)} />
                            </div>
                          </div>
                        </div>
                    ))}
                    {companions.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                          <Users className="h-16 w-16 text-[#333333] mx-auto mb-4"/>
                          <p className="text-[#555] text-lg">No hay acompañantes registrados.</p>
                        </div>
                    )}
                  </div>
                </div>
            )}

            {/* PASO 3: FIRMA Y LEGAL */}
            {currentStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto h-full">
                  {/* Lado Legal */}
                  <div className="space-y-8 flex flex-col justify-center">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Términos Legales</h3>
                      <p className="text-muted-foreground">Lea y acepte para continuar.</p>
                    </div>
                    <div className="space-y-6 p-8 bg-[#141414] rounded-2xl border border-border">
                      <div className="flex gap-4 items-start">
                        <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c as boolean)} className="mt-1 border-[#555] h-5 w-5 data-[state=checked]:bg-primary"/>
                        <div className="grid gap-1">
                          <Label htmlFor="terms" className="text-base font-medium text-foreground cursor-pointer">Reglamento Interno</Label>
                          <p className="text-sm text-[#777]">Acepto las políticas de cancelación, horarios y normas de convivencia del hotel.</p>
                        </div>
                      </div>
                      <div className="h-px bg-[#333333]" />
                      <div className="flex gap-4 items-start">
                        <Checkbox id="privacy" checked={dataPolicyAccepted} onCheckedChange={(c) => setDataPolicyAccepted(c as boolean)} className="mt-1 border-[#555] h-5 w-5 data-[state=checked]:bg-primary"/>
                        <div className="grid gap-1">
                          <Label htmlFor="privacy" className="text-base font-medium text-foreground cursor-pointer">Tratamiento de Datos (Habeas Data)</Label>
                          <p className="text-sm text-[#777]">Autorizo el uso de mis datos personales según la Ley 1581 de 2012 para fines del servicio.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lado Firma - MODIFICADO: Altura aumentada */}
                  <div className="space-y-4 flex flex-col h-full">
                    <h3 className="text-xl font-bold text-foreground">Firma Digital</h3>

                    <div className="flex-1 min-h-[300px] border-2 border-dashed border-[#444] bg-background rounded-xl overflow-hidden relative shadow-inner">
                      {/* Canvas con resolución interna aumentada para evitar pixelado en pantallas grandes */}
                      <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                          width={800}
                          height={400}
                          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                      />
                      {!isDrawing && !signature && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#333333] pointer-events-none">
                            <PenTool className="h-12 w-12 mb-2 opacity-20"/>
                            <span className="text-xl font-medium opacity-40">Firmar en este espacio</span>
                          </div>
                      )}
                    </div>

                    <Button variant="outline" onClick={clearSignature} className="text-[#CF6679] border-border hover:bg-[#CF6679]/10 hover:border-[#CF6679] w-full h-12">
                      <Trash2 className="h-5 w-5 mr-2"/> Borrar Firma y Reintentar
                    </Button>
                  </div>
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-[#141414] border-t border-border flex justify-between shrink-0">
            <Button variant="outline" size="lg" onClick={() => currentStep > (hasDebt ? 0 : 1) ? setCurrentStep(currentStep-1) : onClose()} className="border-border text-muted-foreground hover:text-foreground hover:bg-accent px-6">
              <ChevronLeft className="h-5 w-5 mr-2"/> Anterior
            </Button>

            {currentStep < 3 ? (
                <Button onClick={() => setCurrentStep(currentStep+1)}
                        size="lg"
                        disabled={(currentStep === 0 && hasDebt) || (currentStep === 1 && !isMainGuestValid()) || (currentStep === 2 && !areCompanionsValid())}
                        className="bg-primary text-black hover:bg-primary/90 font-bold px-8 text-lg"
                >
                  Siguiente <ChevronRight className="h-5 w-5 ml-2"/>
                </Button>
            ) : (
                <Button onClick={handleComplete} size="lg" disabled={!isStep3Valid()} className="bg-[#059669] text-white hover:bg-[#059669]/90 font-bold shadow-lg shadow-green-900/20 px-8 text-lg">
                  <Check className="h-5 w-5 mr-2"/> Confirmar Check-in
                </Button>
            )}
          </div>

          {/* MODAL DE PAGO */}
          <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#D4AF37] flex items-center gap-2 text-xl">
                  <DollarSign className="h-6 w-6"/> Registrar Pago
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label>Monto a pagar</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-[#777] text-lg">$</span>
                    <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="pl-8 bg-background border-border text-2xl font-bold h-14"
                    />
                  </div>
                  <p className="text-sm text-[#777]">Deuda actual: ${pendingAmount.toLocaleString()}</p>
                </div>
                <div className="grid gap-2">
                  <Label>Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-background border-border h-12"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="efectivo" className="text-foreground focus:bg-accent">Efectivo</SelectItem>
                      <SelectItem value="tarjeta" className="text-foreground focus:bg-accent">Tarjeta Débito/Crédito</SelectItem>
                      <SelectItem value="transferencia" className="text-foreground focus:bg-accent">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="border-border text-foreground hover:bg-accent h-11">Cancelar</Button>
                <Button onClick={handleRegisterPayment} className="bg-[#059669] text-white hover:bg-[#059669]/90 h-11 font-bold">Confirmar Pago</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </DialogContent>
      </Dialog>
  )
}