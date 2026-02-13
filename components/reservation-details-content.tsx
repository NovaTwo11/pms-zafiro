"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import {
    ArrowLeft, Mail, Link as LinkIcon, MoreVertical, CreditCard,
    Calendar, Bed, Users, Phone, CheckCircle2, Circle, AlertCircle, XCircle,
    MessageSquare, FileText, ArrowRightLeft, Clock,
    Loader2, LogOut
} from "lucide-react"
import Link from "next/link"

// UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

// System Components & API
import { CheckInWizard } from "@/components/checkin-wizard"
import { ReservationGuestList } from "./reservation-guest-list"
import { CheckoutModal } from "@/components/checkout-modal"
import { api, reservationsApi } from "@/lib/api"
import { ReservationDto, GuestDetailDto } from "@/types"

// Utility para clases
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ')
}

interface ReservationDetailsContentProps {
    reservationId: string
    folioId?: string
}

export function ReservationDetailsContent({ reservationId, folioId }: ReservationDetailsContentProps) {
    const router = useRouter()

    // 1. ESTADOS
    const [reservation, setReservation] = useState<ReservationDto | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // UI States
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeTab, setActiveTab] = useState("general")
    const [isCheckinWizardOpen, setIsCheckinWizardOpen] = useState(false)
    const [editingGuest, setEditingGuest] = useState<GuestDetailDto | null>(null)

    // Modal States
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [isChangeRoomOpen, setIsChangeRoomOpen] = useState(false)
    const [showConfirmCheckout, setShowConfirmCheckout] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    // Balance para el modal de pagos (Estado local temporal)
    const [modalBalance, setModalBalance] = useState(0)

    // ==========================================
    // 2. CARGA DE DATOS (Centralizada)
    // ==========================================
    const fetchReservation = useCallback(async () => {
        try {
            setIsRefreshing(true)
            const data = await reservationsApi.getById(reservationId) as unknown as ReservationDto
            setReservation(data)
        } catch (error) {
            console.error("Error fetching reservation:", error)
            toast.error("Error de conexión", {
                description: "No se pudo cargar la información actualizada."
            })
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [reservationId])

    useEffect(() => {
        fetchReservation()
    }, [fetchReservation])

    // ==========================================
    // 3. HANDLERS LÓGICOS
    // ==========================================

    // --- CHECKOUT ---
    const handleCheckOutRequest = async () => {
        if (!reservation) return;
        setIsProcessing(true)
        setShowConfirmCheckout(false)

        try {
            const data = await reservationsApi.checkout(reservation.id)
            toast.success("Check-out Exitoso", {
                description: `Habitación ${data.roomReleased || reservation.roomId} liberada.`
            })
            await fetchReservation() // Recargar todo
            router.refresh()
        } catch (error: any) {
            if (error.response?.status === 409 && error.response?.data?.error === "OUTSTANDING_DEBT") {
                const balanceData = error.response.data.currentBalance;
                toast.error("Salida Bloqueada", {
                    description: `Deuda pendiente: $${balanceData.toLocaleString()}.`
                })
                // Abrir modal de pago automáticamente con el monto de la deuda
                setModalBalance(balanceData)
                setShowPaymentModal(true)
            } else {
                toast.error("Error al procesar la salida")
            }
        } finally {
            setIsProcessing(false)
        }
    }

    // --- PAGOS ---
    const handlePaymentComplete = async (paymentData: any) => {
        if (!reservation) return;
        setIsProcessing(true)
        setShowPaymentModal(false)

        // Usamos el folioId del backend o el que venga por props
        const targetFolioId = folioId || reservation.folioId;

        if (!targetFolioId) {
            toast.error("Error de Folio", { description: "Esta reserva no tiene un folio activo para recibir pagos." });
            setIsProcessing(false);
            return;
        }

        try {
            // 1. Registrar transacción en backend
            await api.post(`/folios/${targetFolioId}/transactions`, {
                amount: paymentData.finalAmount * -1, // Negativo = Pago
                description: `Pago (${paymentData.method})`,
                type: 2, // Payment
                paymentMethod: paymentData.methodId
            })

            toast.success("Pago Registrado Exitosamente")

            // 2. Recargar datos inmediatamente para ver el nuevo balance
            await fetchReservation()

            // 3. Si veníamos de un checkout fallido y el saldo quedó en 0, reintentar checkout
            // (Opcional: puedes quitar esto si prefieres que el usuario le de clic al botón de nuevo)
            if ((reservation.balance - paymentData.finalAmount) <= 100) {
                // Pequeña pausa para UX
                // setTimeout(() => handleCheckOutRequest(), 500)
            }

        } catch (error: any) {
            console.error(error)
            toast.error("Error al registrar el pago")
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
        const phone = displayGuests[0]?.telefono?.replace(/[^0-9]/g, "")
        if (phone) window.open(`https://wa.me/${phone}`, "_blank")
        else toast.error("No hay teléfono registrado")
    }

    const goToFolios = () => {
        if (reservation?.folioId) {
            router.push(`/folios/${reservation.folioId}`)
        } else {
            router.push(`/folios?reservationId=${reservationId}`)
        }
    }

    // ==========================================
    // 4. RENDER: ESTADOS DE CARGA / ERROR
    // ==========================================
    if (isLoading) return (
        <div className="flex h-full items-center justify-center bg-background animate-pulse">
            <div className="flex flex-col items-center gap-4 text-primary">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-sm font-medium">Cargando detalles...</p>
            </div>
        </div>
    )

    if (!reservation) return (
        <div className="flex h-full flex-col items-center justify-center bg-background text-muted-foreground gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p>No se pudo cargar la reserva.</p>
            <Button onClick={() => window.location.reload()} variant="outline">Reintentar</Button>
        </div>
    )

    // ==========================================
    // 5. VARIABLES SEGURAS (CORRECCIÓN DE NaN)
    // ==========================================
    // Aseguramos que nunca sean undefined para evitar el error de React
    const safeAdults = reservation.adults ?? 0
    const safeChildren = reservation.children ?? 0
    const totalCapacity = safeAdults + safeChildren

    // Cálculos financieros seguros
    const safeTotal = reservation.totalAmount ?? 0
    const safePaid = reservation.paidAmount ?? 0
    // Si el backend envía balance, lo usamos; si no, lo calculamos
    const currentBalanceCalc = reservation.balance ?? (safeTotal - safePaid)

    const percentPaid = safeTotal > 0 ? (safePaid / safeTotal) * 100 : 0

    // Arrays seguros
    const displayGuests = reservation.guests && reservation.guests.length > 0 ? reservation.guests : []
    const displayFolioItems = reservation.folioItems || []

    // Titular principal (Fallback seguro)
    const mainGuest = displayGuests.find(g => g.esTitular) || displayGuests[0] || {
        primerNombre: reservation.mainGuestName || "Huésped",
        primerApellido: "",
        correo: "",
        telefono: "",
        numeroId: "---"
    } as GuestDetailDto

    // Stepper logic
    const steps = ['Reservada', 'Confirmada', 'Hospedado', 'Finalizada']
    const currentStatusStep = reservation.statusStep ?? 1

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto">

            {/* --- MODALES --- */}

            {/* 1. Modal Editar Huésped (Placeholder simple) */}
            <Dialog open={!!editingGuest} onOpenChange={(open) => !open && setEditingGuest(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Editar Huésped</DialogTitle></DialogHeader>
                    <div className="py-4 text-sm text-muted-foreground">Funcionalidad de edición completa pendiente de implementación.</div>
                    <DialogFooter><Button onClick={() => setEditingGuest(null)}>Cerrar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. Modal Confirmar Salida */}
            <AlertDialog open={showConfirmCheckout} onOpenChange={setShowConfirmCheckout}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar Check-out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La habitación <strong>{reservation.roomId}</strong> se marcará como SUCIA y el folio se cerrará.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCheckOutRequest} className="bg-destructive text-white hover:bg-destructive/90">
                            Confirmar Salida
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 3. Modal de Pagos (CheckoutModal) - CORREGIDO */}
            <CheckoutModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                // Usamos el balance del estado local (si viene de botón pagar) o el saldo actual
                total={modalBalance > 0 ? modalBalance : currentBalanceCalc}
                // Pasamos datos BLINDADOS para que el .filter no explote
                activeFolios={[{
                    id: reservation.folioId || "pending-folio",
                    roomNumber: reservation.roomId || "N/A", // Asegura string, nunca undefined
                    guestName: `${mainGuest.primerNombre} ${mainGuest.primerApellido}`.trim() || "Invitado",
                    balance: currentBalanceCalc,
                    status: 'Active'
                }]}
                defaultFolioId={reservation.folioId || "pending-folio"}
                onComplete={handlePaymentComplete}
            />

            <Dialog open={isChangeRoomOpen} onOpenChange={setIsChangeRoomOpen}>
                <DialogContent><DialogTitle>Cambio de Habitación</DialogTitle></DialogContent>
            </Dialog>

            {/* --- HEADER --- */}
            <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/cronograma">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Reserva #{reservation.code || reservation.id.substring(0,6).toUpperCase()}
                                </h1>
                                <Badge variant="outline" className={cn(
                                    "px-2 py-0.5 text-xs uppercase tracking-wider",
                                    reservation.status === 'Cancelled' ? "text-destructive border-destructive" : "text-primary border-primary"
                                )}>
                                    {reservation.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Creada: {reservation.createdDate ? format(new Date(reservation.createdDate), "dd MMM yyyy", { locale: es }) : 'N/A'}
                                </span>
                                <span>•</span>
                                <span className="text-primary">Canal: {reservation.origin || "Directo"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">Acciones <MoreVertical className="h-4 w-4 ml-2" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleCopy(reservation.id, "ID")}>
                                    <LinkIcon className="h-4 w-4 mr-2"/> Copiar ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setIsCancelDialogOpen(true)}>
                                    <XCircle className="h-4 w-4 mr-2"/> Cancelar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Lógica de Botones Principales según StatusStep */}
                        {currentStatusStep < 3 ? (
                            <Button className="bg-primary text-primary-foreground font-bold shadow-sm" onClick={() => setIsCheckinWizardOpen(true)}>
                                <CheckCircle2 className="mr-2 h-4 w-4"/> Check-In
                            </Button>
                        ) : currentStatusStep === 3 ? (
                            <Button variant="destructive" className="font-bold shadow-sm" onClick={() => setShowConfirmCheckout(true)}>
                                <LogOut className="mr-2 h-4 w-4"/> Check-Out
                            </Button>
                        ) : null}

                        {/* Wizard */}
                        {isCheckinWizardOpen && (
                            <CheckInWizard
                                isOpen={isCheckinWizardOpen}
                                onClose={() => setIsCheckinWizardOpen(false)}
                                reservation={{
                                    id: reservation.id,
                                    guestName: `${mainGuest.primerNombre} ${mainGuest.primerApellido}`,
                                    roomNumber: reservation.roomId,
                                    checkIn: reservation.checkIn,
                                    checkOut: reservation.checkOut,
                                    totalAmount: safeTotal,
                                    paidAmount: safePaid
                                }}
                                onComplete={() => {
                                    setIsCheckinWizardOpen(false);
                                    fetchReservation(); // Recargar tras checkin
                                    toast.success("Check-in completado");
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Progress Bar (Stepper) - CORREGIDO */}
                <div className="mt-6 flex items-center justify-between max-w-3xl mx-auto pb-2">
                    {steps.map((step, index) => {
                        const stepNum = index + 1;
                        const isActive = stepNum <= currentStatusStep;
                        return (
                            <div key={step} className="flex flex-col items-center relative flex-1">
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 transition-colors",
                                    isActive ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground"
                                )}>
                                    {isActive ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                </div>
                                <span className={cn(
                                    "text-xs mt-2 font-medium",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}>{step}</span>
                                {index !== 3 && (
                                    <div className={cn(
                                        "absolute top-4 left-1/2 w-full h-[2px] -z-0",
                                        isActive ? "bg-primary" : "bg-border"
                                    )} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </header>

            {/* --- BODY --- */}
            <main className="flex-1 p-6 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                    {/* IZQUIERDA: Tabs de Información */}
                    <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                        <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="huespedes">Huéspedes ({displayGuests.length})</TabsTrigger>
                                <TabsTrigger value="finance">Finanzas</TabsTrigger>
                            </TabsList>

                            {/* TAB: GENERAL */}
                            <TabsContent value="general" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex gap-2"><Calendar className="h-4 w-4"/> Fechas</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">Llegada</p>
                                                    <p className="text-lg font-bold">{reservation.checkIn ? format(new Date(reservation.checkIn), "dd MMM") : "--"}</p>
                                                </div>
                                                <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">Salida</p>
                                                    <p className="text-lg font-bold">{reservation.checkOut ? format(new Date(reservation.checkOut), "dd MMM") : "--"}</p>
                                                </div>
                                            </div>
                                            <div className="text-center text-sm text-muted-foreground bg-muted/50 p-1 rounded">
                                                {safeAdults} Adultos, {safeChildren} Niños ({reservation.nights} Noches)
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex gap-2"><Bed className="h-4 w-4"/> Habitación</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-3xl font-bold">{reservation.roomId}</div>
                                                    <p className="text-sm text-muted-foreground">{reservation.roomName}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setIsChangeRoomOpen(true)}>
                                                <ArrowRightLeft className="h-3 w-3 mr-2" /> Cambiar
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex gap-2"><MessageSquare className="h-4 w-4"/> Notas</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="bg-muted border-l-4 border-primary p-4 rounded-r-md">
                                            <p className="text-sm italic">{reservation.notes || "Sin notas adicionales."}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* TAB: HUÉSPEDES */}
                            <TabsContent value="huespedes" className="mt-4">
                                <ReservationGuestList
                                    guests={displayGuests}
                                    // CORRECCIÓN NAN: Pasamos un número seguro
                                    maxGuests={totalCapacity}
                                    onEditGuest={setEditingGuest}
                                />
                            </TabsContent>

                            {/* TAB: FINANZAS */}
                            <TabsContent value="finance" className="mt-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">Detalle de Cargos</CardTitle>
                                            <CardDescription className="text-xs">Folio #{reservation.folioId || "Pendiente"}</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={goToFolios}>
                                            <FileText className="h-4 w-4 mr-2" /> Ver Folio Completo
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Concepto</TableHead>
                                                    <TableHead className="text-right">Monto</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {displayFolioItems.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                            No hay transacciones registradas aún.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    displayFolioItems.map((item, idx) => (
                                                        <TableRow key={item.id || idx}>
                                                            <TableCell className="font-mono text-xs">{item.date}</TableCell>
                                                            <TableCell>{item.concept}</TableCell>
                                                            <TableCell className={cn("text-right font-bold text-xs", item.price < 0 ? "text-green-600" : "")}>
                                                                ${Math.abs(item.price).toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                                <TableRow className="bg-muted border-t-2">
                                                    <TableCell colSpan={2} className="text-right font-bold uppercase text-xs">Total Reserva</TableCell>
                                                    <TableCell className="text-right font-bold text-sm text-primary">${safeTotal.toLocaleString()}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* DERECHA: Sidebar de Balance */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="overflow-hidden border-primary/20 shadow-md">
                            <div className="bg-muted p-4 border-b flex justify-between items-center">
                                <span className="font-semibold">Balance de Cuenta</span>
                                <Badge variant={currentBalanceCalc > 100 ? "destructive" : "default"}>
                                    {currentBalanceCalc > 100 ? "Pendiente" : "Pagado"}
                                </Badge>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-primary">${safeTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Pagado: ${safePaid.toLocaleString()}</span>
                                        <span>{percentPaid.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={percentPaid} className="h-2" />
                                </div>

                                {currentBalanceCalc > 100 && (
                                    <div className="bg-destructive/10 border border-destructive/20 rounded p-3 flex gap-2 items-start">
                                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-destructive font-medium">Saldo Pendiente</p>
                                            <p className="text-sm font-bold text-destructive">${currentBalanceCalc.toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                <Button className="w-full font-bold"
                                        onClick={() => {
                                            setModalBalance(currentBalanceCalc);
                                            setShowPaymentModal(true);
                                        }}
                                        disabled={currentBalanceCalc <= 0}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" /> Registrar Pago
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3 border-b"><CardTitle className="text-sm font-medium flex gap-2"><Users className="h-4 w-4"/> Titular</CardTitle></CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-12 w-12 border"><AvatarFallback>{mainGuest.primerNombre?.[0]}</AvatarFallback></Avatar>
                                    <div>
                                        <p className="font-bold text-sm">{mainGuest.primerNombre} {mainGuest.primerApellido}</p>
                                        <p className="text-xs text-muted-foreground">ID: {mainGuest.numeroId}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => mainGuest.correo && handleCopy(mainGuest.correo, "Email")}>
                                        <Mail className="h-4 w-4" /> <span className="truncate">{mainGuest.correo || "Sin correo"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Phone className="h-4 w-4" /> <span>{mainGuest.telefono || "Sin teléfono"}</span>
                                    </div>
                                </div>
                                <Separator className="my-4"/>
                                <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleWhatsApp} disabled={!mainGuest.telefono}>
                                    Contactar por WhatsApp
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}