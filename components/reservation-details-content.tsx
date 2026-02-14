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
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// System Components & API
import { CheckInWizard } from "@/components/checkin-wizard"
import { ReservationGuestList } from "./reservation-guest-list"
import { CheckoutModal } from "@/components/checkout-modal"
import { GuestFormDrawer } from "@/components/guest-form-drawer"
import { api, reservationsApi } from "@/lib/api"
import { ReservationDto, GuestDetailDto, RoomDto } from "@/types"

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

    const [activeTab, setActiveTab] = useState("general")
    const [isCheckinWizardOpen, setIsCheckinWizardOpen] = useState(false)
    const [editingGuest, setEditingGuest] = useState<GuestDetailDto | null>(null)

    // Estado para el modal de éxito de correos/facturas
    const [successDialog, setSuccessDialog] = useState<{isOpen: boolean, title: string, message: string}>({
        isOpen: false, title: "", message: ""
    })

    // Modal States
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [isChangeRoomOpen, setIsChangeRoomOpen] = useState(false)
    const [showConfirmCheckout, setShowConfirmCheckout] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    // Estados para Cambio de Habitación
    const [availableRooms, setAvailableRooms] = useState<RoomDto[]>([])
    const [selectedNewRoom, setSelectedNewRoom] = useState<string>("")

    // Balance para el modal de pagos
    const [modalBalance, setModalBalance] = useState(0)

    // ==========================================
    // 2. CARGA DE DATOS (Centralizada)
    // ==========================================
    const fetchReservation = useCallback(async () => {
        try {
            const data = await reservationsApi.getById(reservationId) as unknown as ReservationDto
            setReservation(data)
        } catch (error) {
            console.error("Error fetching reservation:", error)
            toast.error("Error de conexión", {
                description: "No se pudo cargar la información actualizada."
            })
        } finally {
            setIsLoading(false)
        }
    }, [reservationId])

    useEffect(() => {
        fetchReservation()
    }, [fetchReservation])

    // ==========================================
    // 3. HANDLERS LÓGICOS
    // ==========================================

    // --- ENVIAR FACTURA ---
    const handleSendInvoice = async () => {
        if (!reservation?.folioId) return;
        setIsProcessing(true);
        toast.info("Generando y enviando factura...");
        try {
            await api.post(`/folios/${reservation.folioId}/send-invoice`);
            setSuccessDialog({
                isOpen: true,
                title: "¡Factura Enviada!",
                message: `El detalle financiero ha sido enviado exitosamente al correo registrado en la reserva.`
            });
        } catch (error) {
            toast.error("Error al enviar la factura");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- CANCELAR RESERVA ---
    const handleCancelReservation = async () => {
        if (!reservation) return;
        setIsCancelling(true);
        try {
            await reservationsApi.cancel(reservation.id);
            toast.success("Reserva cancelada correctamente");
            setIsCancelDialogOpen(false);
            await fetchReservation();
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error al cancelar la reserva");
        } finally {
            setIsCancelling(false);
        }
    }

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
            await fetchReservation()
            router.refresh()
        } catch (error: any) {
            if (error.response?.status === 409 && error.response?.data?.error === "OUTSTANDING_DEBT") {
                const balanceData = error.response.data.currentBalance;
                toast.error("Salida Bloqueada", {
                    description: `Deuda pendiente: $${balanceData.toLocaleString()}.`
                })
                setModalBalance(balanceData)
                setShowPaymentModal(true)
            } else {
                toast.error("Error al procesar la salida")
            }
        } finally {
            setIsProcessing(false)
        }
    }

    // --- PAGOS (Lógica Flexible Pre-Checkin) ---
    const handleOpenPayment = async () => {
        if (!reservation) return;

        if (reservation.folioId) {
            const initialAmount = (reservation.balance ?? 0) > 0 ? (reservation.balance ?? 0) : 0;
            setModalBalance(initialAmount);
            setShowPaymentModal(true);
            return;
        }

        try {
            setIsProcessing(true);
            await reservationsApi.ensureFolio(reservationId);
            toast.success("Cuenta habilitada para pagos anticipados");
            await fetchReservation();
            setModalBalance(reservation.totalAmount ?? 0);
            setShowPaymentModal(true);
        } catch (error) {
            console.error(error);
            toast.error("Error", { description: "No se pudo habilitar la cuenta de cobro." });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentComplete = async (paymentData: any) => {
        if (!reservation) return;
        setIsProcessing(true)

        const targetFolioId = folioId || reservation.folioId;

        if (!targetFolioId) {
            toast.error("Error de Folio", { description: "No se pudo identificar la cuenta destino." });
            setIsProcessing(false);
            return;
        }

        try {
            const amountToSend = Math.abs(paymentData.finalAmount);
            await api.post(`/folios/${targetFolioId}/transactions`, {
                amount: amountToSend,
                description: `Pago (${paymentData.method})`,
                type: 1,
                paymentMethod: paymentData.methodId
            })

            toast.success("Pago Registrado")
            setShowPaymentModal(false)
            await fetchReservation()
        } catch (error: any) {
            console.error(error)
            toast.error("Error al registrar el pago")
        } finally {
            setIsProcessing(false)
        }
    }

    // --- CAMBIO DE HABITACIÓN ---
    const handleOpenMoveRoom = async () => {
        setIsChangeRoomOpen(true);
        setAvailableRooms([]);
        try {
            const rooms = await reservationsApi.getAvailableRoomsForMove(reservationId);
            setAvailableRooms(rooms);
        } catch (e) {
            console.error(e);
            toast.error("Error cargando habitaciones disponibles");
        }
    };

    const handleConfirmMoveRoom = async () => {
        if (!selectedNewRoom) return;
        try {
            setIsProcessing(true);
            await reservationsApi.moveSegment(reservationId, 0, selectedNewRoom);
            toast.success("Habitación cambiada exitosamente");
            setIsChangeRoomOpen(false);
            await fetchReservation();
        } catch (error: any) {
            console.error(error);
            toast.error("Error al cambiar habitación", { description: error.response?.data?.message });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- GESTIÓN DE HUÉSPEDES ---
    const handleGuestUpdate = async (formData: any) => {
        try {
            if (formData && editingGuest && editingGuest.id) {
                await api.put(`/guests/${editingGuest.id}`, formData);
                toast.success("Huésped actualizado correctamente");
            }
            await fetchReservation();
            setEditingGuest(null);
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar huésped");
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
    // 5. VARIABLES SEGURAS
    // ==========================================
    const safeAdults = reservation.adults ?? 0
    const safeChildren = reservation.children ?? 0
    const totalCapacity = safeAdults + safeChildren
    const safeTotal = reservation.totalAmount ?? 0
    const safePaid = reservation.paidAmount ?? 0
    const currentBalanceCalc = reservation.balance ?? (safeTotal - safePaid)
    const percentPaid = safeTotal > 0 ? (safePaid / safeTotal) * 100 : 0
    const displayGuests = reservation.guests && reservation.guests.length > 0 ? reservation.guests : []
    const displayFolioItems = reservation.folioItems || []

    const mainGuest = displayGuests.find(g => g.esTitular) || displayGuests[0] || {
        id: "", primerNombre: reservation.mainGuestName || "Huésped", primerApellido: "",
        correo: "", telefono: "", numeroId: "---", tipoId: "", nacionalidad: "",
        esTitular: true, isSigned: false
    } as GuestDetailDto

    const steps = ['Reservada', 'Confirmada', 'Hospedado', 'Finalizada']
    const currentStatusStep = reservation.statusStep ?? 1

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto">

            {/* --- MODALES --- */}

            {/* Modal de Éxito para Correos y Facturas */}
            <Dialog open={successDialog.isOpen} onOpenChange={(open) => setSuccessDialog(prev => ({...prev, isOpen: open}))}>
                <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                        <DialogTitle className="text-center text-xl">{successDialog.title}</DialogTitle>
                        <DialogDescription className="text-center text-md pt-2">
                            {successDialog.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center mt-4">
                        <Button type="button" onClick={() => setSuccessDialog(prev => ({...prev, isOpen: false}))} className="bg-primary text-black hover:bg-primary/90">
                            Aceptar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 1. Modal Editar Huésped */}
            <GuestFormDrawer
                open={!!editingGuest}
                onOpenChange={(open) => !open && setEditingGuest(null)}
                guestToEdit={editingGuest}
                onGuestSaved={handleGuestUpdate}
            />

            {/* Modal Confirmar Cancelación */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de cancelar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto no se puede deshacer. La reserva pasará a estado Cancelado y se liberará la disponibilidad de la habitación <strong>{reservation.roomId}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelReservation}
                            disabled={isCancelling}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <XCircle className="h-4 w-4 mr-2"/>}
                            Sí, cancelar reserva
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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

            {/* 3. Modal de Pagos (CheckoutModal) */}
            <CheckoutModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                total={modalBalance > 0 ? modalBalance : currentBalanceCalc}
                activeFolios={[{
                    id: reservation.folioId || "pending-folio",
                    roomNumber: reservation.roomId || "N/A",
                    guestName: `${mainGuest.primerNombre} ${mainGuest.primerApellido}`.trim() || "Invitado",
                    balance: currentBalanceCalc,
                    status: 'Active'
                }]}
                defaultFolioId={reservation.folioId || "pending-folio"}
                onComplete={handlePaymentComplete}
            />

            {/* 4. Modal de Cambio de Habitación */}
            <Dialog open={isChangeRoomOpen} onOpenChange={setIsChangeRoomOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mover Reservación</DialogTitle>
                        <DialogDescription>Seleccione la nueva habitación para asignar a esta reserva.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Nueva Habitación</Label>
                            <Select onValueChange={setSelectedNewRoom}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar habitación..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRooms.length === 0 ? (
                                        <div className="p-2 text-xs text-muted-foreground text-center">Cargando o sin disponibilidad...</div>
                                    ) : (
                                        availableRooms.map(r => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.number} - {r.category} (${r.basePrice.toLocaleString()})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                            <p><strong>Nota:</strong> Esta acción moverá el segmento principal de la reserva. Si la reserva tiene múltiples segmentos, solo se afectará el actual.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangeRoomOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmMoveRoom} disabled={isProcessing || !selectedNewRoom}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <ArrowRightLeft className="h-4 w-4 mr-2"/>}
                            Confirmar Cambio
                        </Button>
                    </DialogFooter>
                </DialogContent>
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
                                <DropdownMenuItem onClick={handleSendInvoice} disabled={isProcessing || !reservation.folioId}>
                                    <Mail className="h-4 w-4 mr-2"/> Enviar Factura
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
                                    paidAmount: safePaid,
                                    mainGuestData: mainGuest,
                                    companionsData: displayGuests.filter(g => !g.esTitular)
                                }}
                                onComplete={() => {
                                    setIsCheckinWizardOpen(false);
                                    fetchReservation();
                                    toast.success("Check-in completado");
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Progress Bar (Stepper) */}
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
                                            <Button variant="outline" size="sm" className="w-full mt-4" onClick={handleOpenMoveRoom}>
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
                                        onClick={handleOpenPayment}
                                        disabled={reservation.status === 'Cancelled'}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    {reservation.folioId ? "Registrar Pago" : "Habilitar Cuenta y Pagar"}
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

                                {/* Visualización de Firma Digital */}
                                {(mainGuest.isSigned) && (
                                    <div className="mt-4 border-t pt-4">
                                        <div className="flex items-center gap-2 text-[#059669] bg-[#059669]/10 p-2 rounded border border-[#059669]/20">
                                            <CheckCircle2 className="h-4 w-4"/>
                                            <span className="text-xs font-bold">Registro Legal Firmado</span>
                                        </div>
                                    </div>
                                )}

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