"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import {
    ArrowLeft, Mail, Link as LinkIcon, Printer,
    Edit, MoreVertical, CreditCard,
    Calendar, Bed, Users, Phone, MapPin,
    CheckCircle2, Circle, AlertCircle, XCircle,
    Copy, MessageSquare, ExternalLink, FileText,
    ArrowRightLeft, DollarSign, Search, Clock,
    Save, User, Briefcase, Globe, LogOut, Loader2
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

// --- COMPONENTES DEL SISTEMA ---
import { CheckInWizard } from "@/components/checkin-wizard"
import { ReservationGuestList } from "./reservation-guest-list"
import { CheckoutModal, PaymentMethodType } from "@/components/checkout-modal"

// --- INTERFACES ---

interface Guest {
    id: string
    primerNombre: string
    segundoNombre?: string
    primerApellido: string
    segundoApellido?: string
    correo: string
    telefono: string
    paisOrigen?: string
    ciudadOrigen?: string
    paisResidencia?: string
    ciudadResidencia?: string
    direccionResidencia?: string
    tipoId: string
    numeroId: string
    nacionalidad?: string
    ocupacion?: string
    fechaNacimiento?: string
    esTitular: boolean
    isSigned: boolean
}

// Datos Mock (Se usarán si no vienen props del servidor)
const initialReservationData: any = {
    id: "RES-2026-001",
    checkInCode: "ZAF-8821",
    roomId: "101",
    roomName: "Suite Deluxe - Vista Mar",
    status: "hospedado", // Estado actual para probar check-out
    statusStep: 3, // 1: Reservada, 2: Confirmada, 3: Hospedado, 4: Finalizada
    startDate: "2026-02-10",
    endDate: "2026-02-15",
    adults: 2,
    children: 1,
    totalAmount: 720000,
    paidAmount: 620000, // Deuda parcial para probar validación
    currency: "COP",
    origin: "Booking.com",
    createdDate: "2026-01-02T10:00:00",
    notes: "Cliente solicita almohadas extra. Alérgico al maní.",
    guests: [
        {
            id: "g1",
            primerNombre: "Carlos",
            segundoNombre: "Andrés",
            primerApellido: "García",
            segundoApellido: "Márquez",
            correo: "carlos.garcia@email.com",
            telefono: "+573001234567",
            paisOrigen: "Colombia",
            ciudadOrigen: "Medellín",
            paisResidencia: "Colombia",
            ciudadResidencia: "Bogotá",
            direccionResidencia: "Calle 123 # 45-67",
            tipoId: "CC",
            numeroId: "1098765432",
            nacionalidad: "Colombiano",
            ocupacion: "Ingeniero de Sistemas",
            fechaNacimiento: "1990-05-15",
            esTitular: true,
            isSigned: true
        }
    ],
    folioItems: [
        { id: 1, date: "2026-02-10", concept: "Noche de Alojamiento", qty: 1, price: 180000, total: 180000 },
        { id: 2, date: "2026-02-11", concept: "Noche de Alojamiento", qty: 1, price: 180000, total: 180000 },
        { id: 3, date: "2026-02-12", concept: "Restaurante - Cena", qty: 1, price: 45000, total: 45000 },
    ]
}

// Props: Permitimos inyección de datos reales o usamos el mock
interface ReservationDetailsContentProps {
    reservationData?: any // Idealmente usar tu ReservationDto aquí
    reservationId: string
    folioId?: string // ID del folio para transacciones
}

export function ReservationDetailsContent({ reservationData, reservationId, folioId = "folio-mock-1" }: ReservationDetailsContentProps) {
    const router = useRouter()

    // State principal
    const [reservation, setReservation] = useState(reservationData || initialReservationData)

    // UI States
    const [activeTab, setActiveTab] = useState("general")
    const [isCheckinWizardOpen, setIsCheckinWizardOpen] = useState(false)
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null)

    // Modal States (Gestión)
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [isChangeRoomOpen, setIsChangeRoomOpen] = useState(false)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false) // Modal simple manual

    // --- NUEVO: States para Flujo de Check-out ---
    const [showConfirmCheckout, setShowConfirmCheckout] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false) // Modal inteligente de deuda
    const [isProcessing, setIsProcessing] = useState(false)
    const [currentBalance, setCurrentBalance] = useState(reservation.totalAmount - reservation.paidAmount)

    // Cálculos
    const nights = differenceInDays(new Date(reservation.endDate), new Date(reservation.startDate))
    const totalCapacity = reservation.adults + reservation.children
    const pendingAmount = reservation.totalAmount - reservation.paidAmount
    const percentPaid = (reservation.paidAmount / reservation.totalAmount) * 100

    // --- HANDLERS LÓGICOS ---

    // 1. Ejecución de Check-out (Conexión Backend)
    const handleCheckOutRequest = async () => {
        setIsProcessing(true)
        setShowConfirmCheckout(false)

        try {
            // Llamada al endpoint que creamos en el paso anterior
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservation.id}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await response.json()

            if (!response.ok) {
                // Caso: Deuda Pendiente (Regla de Negocio)
                if (response.status === 409 && data.error === "OUTSTANDING_DEBT") {
                    toast.error("Salida Bloqueada", {
                        description: `El huésped tiene saldo pendiente de $${data.currentBalance.toLocaleString()}. Debe saldar la cuenta.`
                    })
                    setCurrentBalance(data.currentBalance) // Actualizamos saldo real del server
                    setShowPaymentModal(true) // Abrimos modal de pago forzoso
                    return
                }
                throw new Error(data.message || "Error al procesar la salida")
            }

            // Caso Exitoso
            setReservation({ ...reservation, status: "finalizada", statusStep: 4 })
            toast.success("Check-out Exitoso", {
                description: `Habitación ${data.roomReleased} liberada y marcada como SUCIA.`
            })
            router.refresh()

        } catch (error: any) {
            // Fallback para demo si no hay API
            console.error("API Error (Demo Mode):", error)

            // Simulación Local para demostración si falla API
            if (pendingAmount > 100) {
                toast.error("Salida Bloqueada (Demo)", { description: "Deuda pendiente detectada." })
                setShowPaymentModal(true)
            } else {
                setReservation({ ...reservation, status: "finalizada", statusStep: 4 })
                toast.success("Check-out Exitoso (Local)")
            }
        } finally {
            setIsProcessing(false)
        }
    }

    // 2. Callback tras pago exitoso en el Modal
    const handlePaymentComplete = async (paymentData: any) => {
        setIsProcessing(true)
        setShowPaymentModal(false)

        try {
            // Registrar pago en backend
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/folios/${folioId}/transactions`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: paymentData.finalAmount * -1,
                    description: `Pago Salida (${paymentData.method})`,
                    type: 2,
                    paymentMethod: paymentData.methodId
                })
            })

            toast.success("Pago Registrado", { description: "Saldo actualizado correctamente." })

            // Actualizar estado local
            const newPaid = reservation.paidAmount + paymentData.finalAmount
            setReservation({ ...reservation, paidAmount: newPaid })
            setCurrentBalance(0)

            // Reintentar Check-out automáticamente
            setTimeout(() => handleCheckOutRequest(), 800)

        } catch (e) {
            toast.success("Pago registrado (Simulación)", { description: "Procediendo al check-out..." })
            // Simulación
            setReservation({ ...reservation, paidAmount: reservation.totalAmount })
            setCurrentBalance(0)
            setTimeout(() => handleCheckOutRequest(), 800)
        } finally {
            setIsProcessing(false)
        }
    }

    // --- UTILS ---
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado`)
    }

    const handleWhatsApp = () => {
        const phone = reservation.guests[0].telefono.replace(/[^0-9]/g, "")
        window.open(`https://wa.me/${phone}`, "_blank")
    }

    const goToFolios = () => {
        router.push(`/folios?reservationId=${reservationId}`)
    }

    const handleCheckinComplete = () => {
        setIsCheckinWizardOpen(false)
        setReservation({ ...reservation, status: "hospedado", statusStep: 3 })
        toast.success("Check-in completado", { description: "Habitación ocupada y folio activo." })
    }

    const steps = ['Reservada', 'Confirmada', 'Hospedado', 'Finalizada']

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto">

            {/* --- MODALES --- */}

            {/* 1. Edición de Huésped */}
            <Dialog open={!!editingGuest} onOpenChange={(open) => !open && setEditingGuest(null)}>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-[700px] h-[85vh] p-0 flex flex-col">
                    <DialogHeader className="px-6 py-4 border-b border-border">
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <User className="h-5 w-5 text-[#D4AF37]" /> Editar Datos del Huésped
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Completa todos los campos necesarios para el registro hotelero.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 px-6 py-4">
                        {/* Formulario simplificado para brevedad, expandir según necesidad */}
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input value={editingGuest?.primerNombre} onChange={e => setEditingGuest(prev => prev ? {...prev, primerNombre: e.target.value} : null)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Apellido</Label>
                                    <Input value={editingGuest?.primerApellido} onChange={e => setEditingGuest(prev => prev ? {...prev, primerApellido: e.target.value} : null)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Documento</Label>
                                <Input value={editingGuest?.numeroId} onChange={e => setEditingGuest(prev => prev ? {...prev, numeroId: e.target.value} : null)} />
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="px-6 py-4 border-t border-border bg-card">
                        <Button variant="ghost" onClick={() => setEditingGuest(null)}>Cancelar</Button>
                        <Button className="bg-primary text-black hover:bg-[#B5952F]" onClick={() => {
                            toast.success("Guardado"); setEditingGuest(null);
                        }}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. Confirmación Check-out */}
            <AlertDialog open={showConfirmCheckout} onOpenChange={setShowConfirmCheckout}>
                <AlertDialogContent className="bg-card border-border text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar salida del huésped?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Esta acción cerrará el folio y marcará la habitación <strong>{reservation.roomId}</strong> como <span className="text-orange-500 font-bold">SUCIA</span>.
                            <br /><br />
                            Si existe saldo pendiente, se solicitará el pago.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border hover:bg-[#333333] hover:text-white">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleCheckOutRequest(); }}
                            className="bg-red-600 text-white hover:bg-red-700"
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                            Confirmar Salida
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 3. Modal de Pago Inteligente (Checkout) */}
            <CheckoutModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                total={currentBalance}
                activeFolios={[{
                    id: folioId,
                    roomNumber: reservation.roomId,
                    guestName: `${reservation.guests[0].primerNombre} ${reservation.guests[0].primerApellido}`,
                    balance: currentBalance,
                    status: 'Active'
                }]}
                defaultFolioId={folioId}
                onComplete={handlePaymentComplete}
            />

            {/* 4. Modal Cambio Habitación (Placeholder) */}
            <Dialog open={isChangeRoomOpen} onOpenChange={setIsChangeRoomOpen}>
                <DialogContent className="bg-card border-border"><DialogTitle>Cambio de Habitación</DialogTitle></DialogContent>
            </Dialog>

            {/* --- HEADER PRINCIPAL --- */}
            <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/cronograma">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-[#333333]">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-white">Reserva #{reservation.id}</h1>
                                <Badge variant="outline" className={`border-[#D4AF37] px-2 py-0.5 text-xs uppercase tracking-wider ${reservation.status === 'finalizada' ? 'bg-gray-800 text-gray-400' : 'text-[#D4AF37] bg-primary/10'}`}>
                                    {reservation.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Creada: {format(new Date(reservation.createdDate), "dd MMM yyyy", { locale: es })}</span>
                                <span>•</span>
                                <span className="text-[#D4AF37]">Canal: {reservation.origin}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-border text-foreground bg-card hover:bg-[#333333]">
                                    Acciones <MoreVertical className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                                <DropdownMenuItem className="hover:bg-[#333333]" onClick={() => handleCopy("link-mock", "Link")}>
                                    <LinkIcon className="h-4 w-4 mr-2" /> Copiar Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#333333]" />
                                <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => setIsCancelDialogOpen(true)}>
                                    <XCircle className="h-4 w-4 mr-2" /> Cancelar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* BOTÓN DE ACCIÓN PRINCIPAL (DINÁMICO) */}
                        {reservation.statusStep < 3 ? (
                            <Button
                                className="bg-primary text-black hover:bg-[#B5952F] font-semibold shadow-lg shadow-amber-900/20"
                                onClick={() => setIsCheckinWizardOpen(true)}
                            >
                                Check-In
                            </Button>
                        ) : reservation.status === 'hospedado' ? (
                            <Button
                                className="bg-red-600 text-white hover:bg-red-700 font-semibold shadow-lg shadow-red-900/20 transition-all active:scale-95"
                                onClick={() => setShowConfirmCheckout(true)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>Procesando...</>
                                ) : (
                                    <>
                                        <LogOut className="h-4 w-4 mr-2" /> Check-Out
                                    </>
                                )}
                            </Button>
                        ) : null}

                        {/* Wizard Component */}
                        {isCheckinWizardOpen && (
                            <CheckInWizard
                                isOpen={isCheckinWizardOpen}
                                onClose={() => setIsCheckinWizardOpen(false)}
                                reservation={{
                                    id: reservation.id,
                                    guestName: `${reservation.guests[0].primerNombre} ${reservation.guests[0].primerApellido}`,
                                    roomNumber: reservation.roomId,
                                    checkIn: new Date(reservation.startDate),
                                    checkOut: new Date(reservation.endDate),
                                    totalAmount: reservation.totalAmount,
                                    paidAmount: reservation.paidAmount
                                }}
                                onComplete={handleCheckinComplete}
                            />
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 flex items-center justify-between max-w-3xl mx-auto pb-2">
                    {steps.map((step, index) => {
                        const stepNum = index + 1;
                        const isActive = stepNum <= reservation.statusStep;
                        return (
                            <div key={step} className="flex flex-col items-center relative flex-1">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 transition-colors ${isActive ? 'bg-primary border-[#D4AF37] text-black' : 'bg-card border-border text-[#555]'}`}>
                                    {isActive ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${isActive ? 'text-[#D4AF37]' : 'text-[#737373]'}`}>{step}</span>
                                {index !== 3 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${isActive ? 'bg-primary' : 'bg-[#333333]'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </header>

            {/* --- CONTENIDO --- */}
            <main className="flex-1 p-6 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                    {/* COLUMNA IZQUIERDA (TABS) */}
                    <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                        <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
                            <div className="flex items-center justify-between mb-4">
                                <TabsList className="bg-card border border-border h-10">
                                    <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-black">General</TabsTrigger>
                                    <TabsTrigger value="huespedes" className="data-[state=active]:bg-primary data-[state=active]:text-black">Huéspedes ({reservation.guests.length})</TabsTrigger>
                                    <TabsTrigger value="finance" className="data-[state=active]:bg-primary data-[state=active]:text-black">Finanzas</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="general" className="space-y-6 mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="bg-card border-border">
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase flex gap-2"><Calendar className="h-4 w-4 text-[#D4AF37]" /> Detalles</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center mb-4">
                                                <div><p className="text-xs text-[#737373]">Check-In</p><p className="text-lg font-bold">{format(new Date(reservation.startDate), "dd MMM", { locale: es })}</p></div>
                                                <ArrowLeft className="h-4 w-4 text-[#555] rotate-180" />
                                                <div className="text-right"><p className="text-xs text-[#737373]">Check-Out</p><p className="text-lg font-bold">{format(new Date(reservation.endDate), "dd MMM", { locale: es })}</p></div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">{reservation.adults} Adultos, {reservation.children} Niños</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-card border-border">
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase flex gap-2"><Bed className="h-4 w-4 text-[#D4AF37]" /> Habitación</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-start">
                                                <div><div className="text-3xl font-bold text-white mb-1">{reservation.roomId}</div><p className="text-sm text-muted-foreground">{reservation.roomName}</p></div>
                                                <Badge className="bg-green-900/20 text-green-400">Limpia</Badge>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full mt-4 border-border text-xs" onClick={() => setIsChangeRoomOpen(true)}><ArrowRightLeft className="h-3 w-3 mr-2" /> Cambiar</Button>
                                        </CardContent>
                                    </Card>
                                </div>
                                <Card className="bg-card border-border">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase flex gap-2"><MessageSquare className="h-4 w-4 text-[#D4AF37]" /> Notas</CardTitle></CardHeader>
                                    <CardContent><div className="bg-[#262626] border-l-4 border-[#D4AF37] p-4 rounded-r-md"><p className="text-sm italic">"{reservation.notes}"</p></div></CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="huespedes">
                                <ReservationGuestList
                                    guests={reservation.guests}
                                    maxGuests={totalCapacity}
                                    onAddGuest={() => setEditingGuest({ id: `new-${Date.now()}`, primerNombre: "", primerApellido: "", correo: "", telefono: "", tipoId: "CC", numeroId: "", esTitular: false, isSigned: false } as Guest)}
                                    onEditGuest={setEditingGuest}
                                    onSignGuest={() => toast("Firma")}
                                />
                            </TabsContent>

                            <TabsContent value="finance">
                                <Card className="bg-card border-border">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                                        <div className="space-y-1"><CardTitle className="text-base">Cargos</CardTitle><CardDescription className="text-xs">Folio #{reservation.id}</CardDescription></div>
                                        <Button variant="outline" size="sm" className="border-[#D4AF37] text-[#D4AF37]" onClick={goToFolios}><FileText className="h-4 w-4 mr-2" /> Ver Folio</Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-[#262626]"><TableRow><TableHead>Fecha</TableHead><TableHead>Concepto</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {reservation.folioItems.map((item: any) => (
                                                    <TableRow key={item.id} className="hover:bg-[#333333]/50">
                                                        <TableCell className="text-xs font-mono">{item.date}</TableCell>
                                                        <TableCell className="text-xs">{item.concept}</TableCell>
                                                        <TableCell className="text-xs font-bold text-right">${item.price.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-[#262626] border-t-2 border-border"><TableCell colSpan={2} className="text-right text-xs font-bold uppercase">Total</TableCell><TableCell className="text-right text-sm font-bold text-[#D4AF37]">${reservation.totalAmount.toLocaleString()}</TableCell></TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* COLUMNA DERECHA (SIDEBAR) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-card border-border overflow-hidden">
                            <div className="bg-[#262626] p-4 border-b border-border flex justify-between items-center">
                                <span className="font-semibold text-foreground">Balance</span>
                                <Badge variant={pendingAmount > 0 ? "destructive" : "default"} className="uppercase text-[10px]">{pendingAmount > 0 ? "Pendiente" : "Pagado"}</Badge>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-lg font-bold"><span className="text-white">Total</span><span className="text-[#D4AF37]">$ {reservation.totalAmount.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-xs text-muted-foreground"><span>Pagado: $ {reservation.paidAmount.toLocaleString()}</span><span>{percentPaid.toFixed(0)}%</span></div>
                                    <Progress value={percentPaid} className="h-2 bg-[#333333]" indicatorColor="bg-green-500" />
                                </div>
                                {pendingAmount > 0 && (
                                    <div className="bg-red-900/10 border border-red-900/30 rounded p-3 flex gap-2 items-start">
                                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                        <div className="flex-1"><p className="text-xs text-red-400 font-medium">Saldo Pendiente</p><p className="text-sm font-bold text-red-500">$ {pendingAmount.toLocaleString()}</p></div>
                                    </div>
                                )}
                                <Button className="w-full bg-[#E5E5E5] text-black hover:bg-card font-semibold" onClick={() => { setCurrentBalance(pendingAmount); setShowPaymentModal(true); }}>
                                    <CreditCard className="h-4 w-4 mr-2" /> Registrar Pago
                                </Button>
                                <Button variant="link" className="w-full text-muted-foreground text-xs" onClick={goToFolios}>Ir a Facturación <ExternalLink className="ml-1 h-3 w-3" /></Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3 border-b border-border/50"><CardTitle className="text-sm font-medium text-muted-foreground uppercase flex gap-2"><Users className="h-4 w-4 text-[#D4AF37]" /> Titular</CardTitle></CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-12 w-12 border border-[#D4AF37]/30"><AvatarFallback className="bg-[#262626] text-[#D4AF37] font-bold">{reservation.guests[0].primerNombre[0]}</AvatarFallback></Avatar>
                                    <div><p className="font-bold text-sm">{reservation.guests[0].primerNombre} {reservation.guests[0].primerApellido}</p><p className="text-xs text-[#737373]">ID: {reservation.guests[0].numeroId}</p></div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 text-muted-foreground cursor-pointer hover:text-white" onClick={() => handleCopy(reservation.guests[0].correo, "Email")}><Mail className="h-4 w-4" /> <span className="truncate">{reservation.guests[0].correo}</span></div>
                                    <div className="flex items-center gap-3 text-muted-foreground"><Phone className="h-4 w-4" /> <span>{reservation.guests[0].telefono}</span></div>
                                </div>
                                <Separator className="bg-[#333333] my-4" />
                                <Button size="sm" variant="outline" className="w-full border-border text-xs" onClick={handleWhatsApp}>WhatsApp</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}