"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  X, ChevronRight, ChevronLeft, User, Users,
  PenTool, Plus, Trash2, Check, AlertTriangle,
  CreditCard, DollarSign, Wallet, Loader2
} from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { api, checkInReservation, reservationsApi, updateGuestInfo } from "@/lib/api"

// --- INTERFACES ---
export interface GuestFormData {
  id: string
  nacionalidad: string
  tipoId: string
  numeroId: string
  fechaNacimiento: string // Renombrado para consistencia
  primerNombre: string
  primerApellido: string
  segundoNombre?: string
  segundoApellido?: string
  telefono: string
  correo?: string
  ciudadOrigen?: string
  direccion?: string;
}

interface CheckinWizardProps {
  isOpen: boolean
  onClose: () => void
  reservation: {
    id: string
    guestName: string
    roomNumber: string
    checkIn: Date | string
    checkOut: Date | string
    totalAmount: number
    paidAmount: number
    // NUEVO: Datos inyectados desde el padre
    mainGuestData?: any
    companionsData?: any[]
  }
  onComplete?: (data?: any) => void
}

const countries = ["Colombia", "Estados Unidos", "España", "México", "Argentina", "Brasil", "Chile", "Perú", "Ecuador", "Venezuela"]
const documentTypes = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PA", label: "Pasaporte" },
  { value: "TI", label: "Tarjeta de Identidad" },
]

export function CheckInWizard({ isOpen, onClose, reservation }: CheckinWizardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // --- ESTADOS FINANCIEROS ---
  const [localPaidAmount, setLocalPaidAmount] = useState(reservation.paidAmount)
  const pendingAmount = reservation.totalAmount - localPaidAmount
  const hasDebt = pendingAmount > 100 // Margen de tolerancia de $100 COP

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("efectivo")

  // --- ESTADOS DEL WIZARD ---
  const [currentStep, setCurrentStep] = useState(hasDebt ? 0 : 1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // PRE-CARGA DATOS DEL TITULAR
  const [mainGuest, setMainGuest] = useState<GuestFormData>(() => {
    const mg = reservation.mainGuestData;
    return {
      id: mg?.id || "main",
      nacionalidad: mg?.nacionalidad || "Colombia",
      tipoId: mg?.tipoId || "CC",
      numeroId: mg?.numeroId || "",
      fechaNacimiento: mg?.fechaNacimiento ? mg.fechaNacimiento.split('T')[0] : "",
      primerNombre: mg?.primerNombre || reservation.guestName.split(" ")[0] || "",
      primerApellido: mg?.primerApellido || reservation.guestName.split(" ").slice(1).join(" ") || "",
      segundoNombre: mg?.segundoNombre || "",
      segundoApellido: mg?.segundoApellido || "",
      telefono: mg?.telefono || "",
      correo: mg?.correo || "",
      ciudadOrigen: mg?.ciudadOrigen || "",
    }
  })

  // PRE-CARGA DATOS ACOMPAÑANTES
  const [companions, setCompanions] = useState<GuestFormData[]>(() => {
    if (!reservation.companionsData || reservation.companionsData.length === 0) return [];
    return reservation.companionsData.map((c: any) => ({
      id: c.id || Date.now().toString() + Math.random(),
      nacionalidad: c.nacionalidad || "Colombia",
      tipoId: c.tipoId || "CC",
      numeroId: c.numeroId || "",
      fechaNacimiento: c.fechaNacimiento ? c.fechaNacimiento.split('T')[0] : "",
      primerNombre: c.primerNombre || "",
      primerApellido: c.primerApellido || "",
      segundoNombre: c.segundoNombre || "",
      segundoApellido: c.segundoApellido || "",
      telefono: c.telefono || "",
      correo: c.correo || "",
      ciudadOrigen: c.ciudadOrigen || "",
    }))
  })

  // Firma y Legal
  const [signature, setSignature] = useState<string>("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [dataPolicyAccepted, setDataPolicyAccepted] = useState(false)

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // --- VALIDACIONES ---
  const isMainGuestValid = () => {
    return (
        mainGuest.tipoId &&
        mainGuest.numeroId &&
        mainGuest.primerNombre &&
        mainGuest.primerApellido &&
        mainGuest.telefono
    )
  }

  const isStep3Valid = () => signature.length > 0 && termsAccepted && dataPolicyAccepted

  // --- HANDLERS PAGOS ---
  const handleOpenPayment = () => {
    setPaymentAmount(pendingAmount.toString())
    setIsPaymentModalOpen(true)
  }

  const handleRegisterPayment = async () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) return

    try {
      const { folioId } = await reservationsApi.ensureFolio(reservation.id);

      const methodMap: Record<string, number> = {
        "efectivo": 1,
        "tarjeta": 2,
        "transferencia": 4
      };
      const methodId = methodMap[paymentMethod] || 1;

      await api.post(`/folios/${folioId}/transactions`, {
        amount: amount,
        description: `Abono Check-in (${paymentMethod})`,
        type: 1,
        paymentMethod: methodId
      });

      const newPaid = localPaidAmount + amount
      setLocalPaidAmount(newPaid)
      setIsPaymentModalOpen(false)
      toast.success("Pago registrado")

      if (reservation.totalAmount - newPaid <= 100) {
        setTimeout(() => setCurrentStep(1), 500)
      }
    } catch (error) {
      console.error(error)
      toast.error("Error al procesar pago")
    }
  }

  // --- HANDLERS ACOMPAÑANTES ---
  const addCompanion = () => {
    setCompanions([...companions, {
      id: Date.now().toString(),
      nacionalidad: "Colombia",
      tipoId: "CC",
      numeroId: "",
      fechaNacimiento: "",
      primerNombre: "",
      primerApellido: "",
      segundoNombre: "",
      segundoApellido: "",
      telefono: "",
      ciudadOrigen: ""
    }])
  }

  const updateCompanion = (id: string, field: keyof GuestFormData, value: string) => {
    setCompanions(companions.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  // --- CORE: SUBMIT LOGIC ---
  const handleFinalSubmit = async () => {
    if (!isStep3Valid()) return
    setIsSubmitting(true)

    try {
      const guestPayload: any = {
        nacionalidad: mainGuest.nacionalidad,
        tipoId: mainGuest.tipoId,
        numeroId: mainGuest.numeroId,
        primerNombre: mainGuest.primerNombre,
        primerApellido: mainGuest.primerApellido,
        segundoNombre: mainGuest.segundoNombre || "",
        segundoApellido: mainGuest.segundoApellido || "",
        telefono: mainGuest.telefono,
        correo: mainGuest.correo || "",
        ciudadOrigen: mainGuest.ciudadOrigen || "",
        fechaNacimiento: mainGuest.fechaNacimiento || "",
        companions: companions.map(c => ({
          primerNombre: c.primerNombre,
          segundoNombre: c.segundoNombre || "",
          primerApellido: c.primerApellido,
          segundoApellido: c.segundoApellido || "",
          numeroId: c.numeroId,
          nacionalidad: c.nacionalidad,
          tipoId: c.tipoId,
          fechaNacimiento: c.fechaNacimiento || "",
          ciudadOrigen: c.ciudadOrigen || ""
        })),
        signatureBase64: signature
      }

      await updateGuestInfo(reservation.id, guestPayload)
      const response = await checkInReservation(reservation.id)

      toast.success("¡Check-in Exitoso!")

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reservations"] }),
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      ])

      onClose()

      if (response.folioId) {
        router.push(`/folios?id=${response.folioId}`)
      } else {
        router.push(`/folios?reservationId=${reservation.id}`)
      }

    } catch (error: any) {
      console.error(error)
      toast.error("Error en el proceso", { description: error.response?.data?.message || "Error desconocido." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- CANVAS LOGIC (Firma) ---
  const getCoordinates = (event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX, clientY
    if ('touches' in event) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = (event as MouseEvent).clientX
      clientY = (event as MouseEvent).clientY
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: any) => {
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getCoordinates(e.nativeEvent)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: any) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    e.preventDefault()
    const { x, y } = getCoordinates(e.nativeEvent)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current) setSignature(canvasRef.current.toDataURL())
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 2
    ctx.strokeStyle = "#0F0F0F"
    ctx.lineCap = "round"
    setSignature("")
  }

  useEffect(() => {
    if (currentStep === 3) {
      setTimeout(() => clearSignature(), 100)
    }
  }, [currentStep])

  const steps = [
    { number: 0, title: "Pagos", icon: CreditCard, hidden: !hasDebt },
    { number: 1, title: "Titular", icon: User, hidden: false },
    { number: 2, title: "Acompañantes", icon: Users, hidden: false },
    { number: 3, title: "Firma", icon: PenTool, hidden: false },
  ].filter(s => !s.hidden)

  return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
        <DialogContent className="w-full max-w-[95vw] lg:max-w-7xl h-[95vh] flex flex-col p-0 bg-background border-border shadow-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Asistente de Check-in</DialogTitle>
            <DialogDescription>Complete el flujo para registrar el ingreso.</DialogDescription>
          </DialogHeader>

          <div className="bg-card px-4 md:px-8 py-4 md:py-6 border-b border-border shrink-0">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Check-in Digital</h2>
                <p className="text-muted-foreground text-sm md:text-lg">
                  Habitación <span className="font-semibold text-primary">{reservation.roomNumber}</span> • {reservation.guestName}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting} className="hover:bg-destructive/10 hover:text-destructive">
                <X className="h-6 w-6"/>
              </Button>
            </div>

            <div className="flex items-center justify-start md:justify-center gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {steps.map((step, idx) => {
                const isActive = currentStep === step.number
                const isCompleted = currentStep > step.number
                return (
                    <div key={step.number} className="flex items-center shrink-0">
                      <div className={cn("flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-all text-sm md:text-base",
                          isActive ? "bg-primary/10 border-primary text-primary font-bold shadow-sm" :
                              isCompleted ? "bg-[#059669]/10 border-[#059669] text-[#059669] font-medium" : "border-transparent text-muted-foreground")}>
                        <step.icon className="h-4 w-4 md:h-5 md:w-5" />
                        <span>{step.title}</span>
                      </div>
                      {idx < steps.length - 1 && <div className="w-4 md:w-8 h-px bg-border mx-2" />}
                    </div>
                )
              })}
            </div>
          </div>

          <div className="px-4 md:px-8 py-6 overflow-y-auto flex-1 bg-background">
            {/* --- PASO 0: DEUDA --- */}
            {currentStep === 0 && (
                <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="text-center space-y-4">
                    <Badge variant="destructive" className="px-6 py-2 text-lg rounded-full bg-[#CF6679] text-white">
                      <AlertTriangle className="h-5 w-5 mr-2" /> Saldo Pendiente Requerido
                    </Badge>
                    <div className="py-4">
                      <h3 className="text-5xl font-bold text-foreground tracking-tight">${pendingAmount.toLocaleString()}</h3>
                      <p className="text-muted-foreground mt-2 text-lg">Debe saldar la cuenta para habilitar el Check-in.</p>
                    </div>
                  </div>

                  <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#CF6679]"></div>
                    <div className="flex justify-between text-base"><span className="text-muted-foreground">Total Reserva</span> <span className="font-medium text-foreground">${reservation.totalAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between text-base"><span className="text-muted-foreground">Abonado</span> <span className="text-[#059669] font-bold">${localPaidAmount.toLocaleString()}</span></div>
                    <div className="h-px bg-border my-2" />
                    <Button className="w-full h-12 text-lg font-bold bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0F0F0F] transition-all shadow-md" onClick={handleOpenPayment}>
                      <Wallet className="h-5 w-5 mr-2" /> Registrar Pago
                    </Button>
                  </div>
                </div>
            )}

            {/* --- PASO 1: TITULAR --- */}
            {currentStep === 1 && (
                <div className="space-y-8 max-w-6xl mx-auto animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xl font-bold text-primary border-b border-border pb-4">Información del Titular</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div className="space-y-2"><Label>Nacionalidad *</Label>
                      <Select value={mainGuest.nacionalidad} onValueChange={v => setMainGuest({...mainGuest, nacionalidad: v})}>
                        <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Tipo ID *</Label>
                      <Select value={mainGuest.tipoId} onValueChange={v => setMainGuest({...mainGuest, tipoId: v})}>
                        <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>{documentTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 xl:col-span-2"><Label>Número ID *</Label>
                      <Input className="bg-card" value={mainGuest.numeroId} onChange={e => setMainGuest({...mainGuest, numeroId: e.target.value})} placeholder="Ej: 1094..."/>
                    </div>

                    <div className="space-y-2"><Label>Primer Nombre *</Label>
                      <Input className="bg-card" value={mainGuest.primerNombre} onChange={e => setMainGuest({...mainGuest, primerNombre: e.target.value})}/>
                    </div>
                    <div className="space-y-2"><Label>Segundo Nombre</Label>
                      <Input className="bg-card" value={mainGuest.segundoNombre} onChange={e => setMainGuest({...mainGuest, segundoNombre: e.target.value})}/>
                    </div>
                    <div className="space-y-2"><Label>Primer Apellido *</Label>
                      <Input className="bg-card" value={mainGuest.primerApellido} onChange={e => setMainGuest({...mainGuest, primerApellido: e.target.value})}/>
                    </div>
                    <div className="space-y-2"><Label>Segundo Apellido</Label>
                      <Input className="bg-card" value={mainGuest.segundoApellido} onChange={e => setMainGuest({...mainGuest, segundoApellido: e.target.value})}/>
                    </div>

                    <div className="space-y-2"><Label>Teléfono *</Label>
                      <Input className="bg-card" type="tel" value={mainGuest.telefono} onChange={e => setMainGuest({...mainGuest, telefono: e.target.value})}/>
                    </div>
                    <div className="space-y-2"><Label>Correo Electrónico</Label>
                      <Input className="bg-card" type="email" value={mainGuest.correo} onChange={e => setMainGuest({...mainGuest, correo: e.target.value})}/>
                    </div>
                    <div className="space-y-2"><Label>Ciudad Origen</Label>
                      <Input className="bg-card" value={mainGuest.ciudadOrigen} onChange={e => setMainGuest({...mainGuest, ciudadOrigen: e.target.value})}/>
                    </div>
                    <div className="space-y-2"><Label>Fecha Nacimiento</Label>
                      <Input type="date" className="bg-card" value={mainGuest.fechaNacimiento} onChange={e => setMainGuest({...mainGuest, fechaNacimiento: e.target.value})}/>
                    </div>
                  </div>
                </div>
            )}

            {/* --- PASO 2: ACOMPAÑANTES --- */}
            {currentStep === 2 && (
                <div className="space-y-8 max-w-6xl mx-auto animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div>
                      <h3 className="text-xl font-bold text-primary">Acompañantes</h3>
                      <p className="text-muted-foreground text-sm">Personas adicionales en la habitación.</p>
                    </div>
                    <Button onClick={addCompanion} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
                      <Plus className="h-4 w-4"/> Agregar
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {companions.map((comp, idx) => (
                        <div key={comp.id} className="p-6 bg-card border border-border rounded-xl relative group shadow-sm transition-all hover:border-primary/50">
                          <div className="absolute top-4 right-4">
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                              setCompanions(companions.filter(c => c.id !== comp.id))
                            }}><Trash2 className="h-4 w-4"/></Button>
                          </div>
                          <Badge variant="outline" className="mb-4 text-primary border-primary/30">Huésped #{idx+1}</Badge>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1"><Label className="text-xs">No. Documento</Label>
                              <Input className="h-9 bg-background" value={comp.numeroId} onChange={e => updateCompanion(comp.id, "numeroId", e.target.value)} />
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Primer Nombre</Label>
                              <Input className="h-9 bg-background" value={comp.primerNombre} onChange={e => updateCompanion(comp.id, "primerNombre", e.target.value)} />
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Primer Apellido</Label>
                              <Input className="h-9 bg-background" value={comp.primerApellido} onChange={e => updateCompanion(comp.id, "primerApellido", e.target.value)} />
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Tipo Doc.</Label>
                              <Select value={comp.tipoId} onValueChange={v => updateCompanion(comp.id, "tipoId", v)}>
                                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>{documentTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Nacionalidad</Label>
                              <Select value={comp.nacionalidad} onValueChange={v => updateCompanion(comp.id, "nacionalidad", v)}>
                                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Ciudad Origen</Label>
                              <Input className="h-9 bg-background" value={comp.ciudadOrigen} onChange={e => updateCompanion(comp.id, "ciudadOrigen", e.target.value)} />
                            </div>
                            <div className="space-y-1 md:col-span-2"><Label className="text-xs">Fecha Nacimiento</Label>
                              <Input type="date" className="h-9 bg-background w-full" value={comp.fechaNacimiento} onChange={e => updateCompanion(comp.id, "fechaNacimiento", e.target.value)} />
                            </div>
                          </div>
                        </div>
                    ))}
                    {companions.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-card/50">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50"/>
                          <p className="text-muted-foreground">No hay acompañantes registrados.</p>
                        </div>
                    )}
                  </div>
                </div>
            )}

            {/* --- PASO 3: FIRMA --- */}
            {currentStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto h-full animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-6 flex flex-col justify-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 text-foreground">Confirmación Legal</h3>
                      <p className="text-muted-foreground">Aceptación de términos y condiciones del servicio.</p>
                    </div>
                    <div className="space-y-4 p-6 bg-card rounded-xl border border-border shadow-sm">
                      <div className="flex gap-3 items-start p-3 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border">
                        <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c as boolean)} className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
                        <div className="grid gap-1">
                          <Label htmlFor="terms" className="font-medium cursor-pointer text-foreground">Reglamento Interno</Label>
                          <p className="text-xs text-muted-foreground">Acepto políticas de cancelación, horarios de Check-out (1:00 PM) y normas de convivencia del establecimiento.</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start p-3 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border">
                        <Checkbox id="privacy" checked={dataPolicyAccepted} onCheckedChange={(c) => setDataPolicyAccepted(c as boolean)} className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
                        <div className="grid gap-1">
                          <Label htmlFor="privacy" className="font-medium cursor-pointer text-foreground">Tratamiento de Datos (Habeas Data)</Label>
                          <p className="text-xs text-muted-foreground">Autorizo el tratamiento de mis datos personales según la Ley 1581 de 2012 para fines comerciales y de registro hotelero.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-foreground">Firma Digital del Titular</h3>
                      {signature && <Badge variant="default" className="bg-[#059669] text-white"><Check className="h-3 w-3 mr-1"/> Verificada</Badge>}
                    </div>

                    <div className="flex-1 min-h-[300px] border-2 border-dashed border-border bg-white rounded-xl overflow-hidden relative shadow-inner cursor-crosshair touch-none">
                      <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full"
                          width={800}
                          height={400}
                          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                      />
                      {!isDrawing && !signature && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none select-none">
                            <PenTool className="h-12 w-12 mb-2 opacity-30"/>
                            <span className="text-sm font-medium opacity-70">Dibuje su firma aquí dentro</span>
                          </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={clearSignature} className="self-end text-destructive hover:bg-destructive/10 border-border hover:border-destructive transition-colors">
                      <Trash2 className="h-4 w-4 mr-2"/> Borrar y repetir
                    </Button>
                  </div>
                </div>
            )}
          </div>

          <div className="px-4 md:px-8 py-4 md:py-6 bg-card border-t border-border flex justify-between shrink-0">
            <Button variant="outline" size="lg" className="border-border hover:bg-accent" onClick={() => currentStep > (hasDebt ? 0 : 1) ? setCurrentStep(currentStep-1) : onClose()} disabled={isSubmitting}>
              <ChevronLeft className="h-5 w-5 mr-2"/> <span className="hidden sm:inline">Atrás</span>
            </Button>

            {currentStep < 3 ? (
                <Button onClick={() => setCurrentStep(currentStep+1)}
                        size="lg"
                        disabled={(currentStep === 0 && hasDebt) || (currentStep === 1 && !isMainGuestValid())}
                        className="bg-primary text-[#0F0F0F] hover:bg-primary/90 px-6 md:px-8 font-bold"
                >
                  Siguiente <ChevronRight className="h-5 w-5 ml-2"/>
                </Button>
            ) : (
                <Button
                    onClick={handleFinalSubmit}
                    size="lg"
                    disabled={!isStep3Valid() || isSubmitting}
                    className="bg-[#059669] text-white hover:bg-[#059669]/90 px-4 md:px-8 min-w-[200px] font-bold shadow-lg"
                >
                  {isSubmitting ? (
                      <><Loader2 className="h-5 w-5 mr-2 animate-spin"/> Procesando...</>
                  ) : (
                      <><Check className="h-5 w-5 mr-2"/> Terminar Check-in</>
                  )}
                </Button>
            )}
          </div>

          <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <DollarSign className="h-5 w-5 text-primary"/> Registrar Pago Inicial
                </DialogTitle>
                <DialogDescription>Ingrese el monto para saldar la cuenta de ingreso.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label>Monto a pagar</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground text-lg font-medium">$</span>
                    <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="pl-8 text-2xl font-bold h-14 bg-background border-primary focus-visible:ring-primary/50"
                    />
                  </div>
                  <p className="text-sm text-[#CF6679]">Deuda actual: ${pendingAmount.toLocaleString()}</p>
                </div>
                <div className="grid gap-2">
                  <Label>Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-12 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta D/C</SelectItem>
                      <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleRegisterPayment} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0F0F0F] font-bold">Aplicar Abono</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </DialogContent>
      </Dialog>
  )
}