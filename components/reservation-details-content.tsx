"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import {
    ArrowLeft, Mail, Link as LinkIcon, Edit, MoreVertical, CreditCard,
    Calendar, Bed, Users, Phone, MapPin, CheckCircle2, Circle, AlertCircle, XCircle,
    Copy, MessageSquare, ExternalLink, FileText, ArrowRightLeft, DollarSign, Search, Clock,
    Save, User, Briefcase, Globe, LogOut, Loader2
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
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

interface ReservationDetailsContentProps {
    reservationId: string
    folioId?: string // Opcional, el backend puede proporcionarlo
}

export function ReservationDetailsContent({ reservationId, folioId }: ReservationDetailsContentProps) {
    const router = useRouter()

    // 1. Estados Principales
    const [reservation, setReservation] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // UI States
    const [activeTab, setActiveTab] = useState("general")
    const [isCheckinWizardOpen, setIsCheckinWizardOpen] = useState(false)
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null)

    // Modal States
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [isChangeRoomOpen, setIsChangeRoomOpen] = useState(false)
    const [showConfirmCheckout, setShowConfirmCheckout] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [currentBalance, setCurrentBalance] = useState(0)

    // ==========================================
    // 2. FETCH INICIAL DE DATOS
    // ==========================================
    useEffect(() => {
        const fetchReservation = async () => {
            try {
                const data = await reservationsApi.getById(reservationId)
                setReservation(data)
                setCurrentBalance(data.balance || (data.totalAmount - data.paidAmount))
            } catch (error) {
                console.error("Error fetching reservation:", error)
                toast.error("Error al cargar la reserva", {
                    description: "No se pudo conectar con el servidor."
                })
            } finally {
                setIsLoading(false)
            }
        }
        fetchReservation()
    }, [reservationId])

    // ==========================================
    // 3. HANDLERS LÓGICOS
    // ==========================================
    const handleCheckOutRequest = async () => {
        setIsProcessing(true)
        setShowConfirmCheckout(false)

        try {
            const data = await reservationsApi.checkout(reservation.id)

            // Éxito
            setReservation({ ...reservation, status: "finalizada", statusStep: 4 })
            toast.success("Check-out Exitoso", {
                description: `Habitación ${data.roomReleased || reservation.roomId} liberada y marcada como SUCIA.`
            })
            router.refresh()

        } catch (error: any) {
            if (error.response?.status === 409 && error.response?.data?.error === "OUTSTANDING_DEBT") {
                const balanceData = error.response.data.currentBalance;
                toast.error("Salida Bloqueada", {
                    description: error.response.data.message || `El huésped tiene saldo pendiente de $${balanceData.toLocaleString()}. Debe saldar la cuenta.`
                })
                setCurrentBalance(balanceData)
                setShowPaymentModal(true)
            } else {
                toast.error("Error al procesar la salida", {
                    description: error.response?.data?.message || error.message || "Verifica tu conexión."
                })
            }
        } finally {
            setIsProcessing(false)
        }
    }

    const handlePaymentComplete = async (paymentData: any) => {
        setIsProcessing(true)
        setShowPaymentModal(false)

        const targetFolioId = folioId || reservation.folioId;

        if (!targetFolioId) {
            toast.error("No hay un folio asociado a esta reserva para registrar el pago.");
            setIsProcessing(false);
            return;
        }

        try {
            await api.post(`/folios/${targetFolioId}/transactions`, {
                amount: paymentData.finalAmount * -1,
                description: `Pago Salida (${paymentData.method})`,
                type: 2,
                paymentMethod: paymentData.methodId
            })

            toast.success("Pago Registrado", { description: "Saldo actualizado en el folio." })

            const newPaid = reservation.paidAmount + paymentData.finalAmount
            setReservation({ ...reservation, paidAmount: newPaid })
            setCurrentBalance(0)

            setTimeout(() => handleCheckOutRequest(), 1000)

        } catch (error: any) {
            toast.error("Error al registrar el pago", {
                description: error.response?.data?.message || "Ocurrió un problema en el servidor."
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado`)
    }

    const handleWhatsApp = () => {
        if (!reservation?.guests?.[0]?.telefono) return;
        const phone = reservation.guests[0].telefono.replace(/[^0-9]/g, "")
        window.open(`https://wa.me/${phone}`, "_blank")
    }

    const goToFolios = () => {
        router.push(`/folios?reservationId=${reservationId}`)
    }

    const handleCheckinComplete = () => {
        setIsCheckinWizardOpen(false)
        setReservation({ ...reservation, status: "checkedin", statusStep: 3 })
        toast.success("Check-in completado", { description: "Habitación ocupada y folio activo." })
    }

    // ==========================================
    // 4. RENDER DE ESTADOS DE CARGA / ERROR
    // ==========================================
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm font-medium">Cargando reserva...</p>
                </div>
            </div>
        )
    }

    if (!reservation) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background text-muted-foreground gap-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p>No se encontró la reserva solicitada.</p>
                <Link href="/cronograma">
                    <Button variant="outline">Volver al inicio</Button>
                </Link>
            </div>
        )
    }

    // ==========================================
    // 5. CÁLCULOS DINÁMICOS
    // ==========================================
    const totalCapacity = reservation.adults + reservation.children
    const pendingAmount = reservation.totalAmount - reservation.paidAmount
    const percentPaid = reservation.totalAmount > 0 ? (reservation.paidAmount / reservation.totalAmount) * 100 : 0
    const steps = ['Reservada', 'Confirmada', 'Hospedado', 'Finalizada']

    // Aseguramos variables seguras para render
    const displayGuests = reservation.guests || []
    const displayFolioItems = reservation.folioItems || []
    const mainGuest = displayGuests[0] || {}

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto">

            {/* --- MODALES --- */}

            <Dialog open={!!editingGuest} onOpenChange={(open) => !open && setEditingGuest(null)}>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-[700px] h-[85vh] p-0 flex flex-col">
                    <DialogHeader className="px-6 py-4 border-b border-border">
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <User className="h-5 w-5 text-primary" /> Editar Datos del Huésped
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Completa todos los campos necesarios para el registro hotelero.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 px-6 py-4">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input value={editingGuest?.primerNombre || ""} onChange={e => setEditingGuest(prev => prev ? {...prev, primerNombre: e.target.value} : null)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Apellido</Label>
                                    <Input value={editingGuest?.primerApellido || ""} onChange={e => setEditingGuest(prev => prev ? {...prev, primerApellido: e.target.value} : null)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Documento</Label>
                                <Input value={editingGuest?.numeroId || ""} onChange={e => setEditingGuest(prev => prev ? {...prev, numeroId: e.target.value} : null)} />
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
                        <Button variant="ghost" onClick={() => setEditingGuest(null)}>Cancelar</Button>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
                            toast.success("Guardado"); setEditingGuest(null);
                        }}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        <AlertDialogCancel className="border-border hover:bg-accent hover:text-accent-foreground">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleCheckOutRequest(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                            Confirmar Salida
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CheckoutModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                total={currentBalance}
                activeFolios={[{
                    id: folioId || reservation.folioId || "pending",
                    roomNumber: reservation.roomId,
                    guestName: (reservation.guests && reservation.guests[0])
                        ? `${reservation.guests[0].primerNombre} ${reservation.guests[0].primerApellido}`
                        : "Huésped",
                    balance: currentBalance,
                    status: 'Active'
                }]}
                defaultFolioId={folioId || reservation.folioId || "pending"}
                onComplete={handlePaymentComplete}
            />

            <Dialog open={isChangeRoomOpen} onOpenChange={setIsChangeRoomOpen}>
                <DialogContent className="bg-card border-border"><DialogTitle>Cambio de Habitación</DialogTitle></DialogContent>
            </Dialog>

            {/* --- HEADER PRINCIPAL --- */}
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
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">Reserva #{reservation.code || reservation.id?.substring(0,8)}</h1>
                                <Badge variant="outline" className={`border-primary px-2 py-0.5 text-xs uppercase tracking-wider ${reservation.status === 'finalizada' || reservation.status === 'checkedout' ? 'bg-muted text-muted-foreground' : 'text-primary bg-primary/10'}`}>
                                    {reservation.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Creada: {reservation.createdDate ? format(new Date(reservation.createdDate), "dd MMM yyyy", { locale: es }) : 'N/A'}</span>
                                <span>•</span>
                                <span className="text-primary">Canal: {reservation.origin}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-border text-foreground bg-card hover:bg-accent hover:text-accent-foreground">
                                    Acciones <MoreVertical className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                                <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer" onClick={() => handleCopy(`https://tudominio.com/r/${reservation.id}`, "Link")}>
                                    <LinkIcon className="h-4 w-4 mr-2" /> Copiar Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem className="text-destructive hover:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer" onClick={() => setIsCancelDialogOpen(true)}>
                                    <XCircle className="h-4 w-4 mr-2" /> Cancelar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* BOTÓN DE ACCIÓN PRINCIPAL (DINÁMICO) */}
                        {reservation.statusStep < 3 ? (
                            <Button
                                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
                                onClick={() => setIsCheckinWizardOpen(true)}
                            >
                                Check-In
                            </Button>
                        ) : (reservation.status === 'hospedado' || reservation.status === 'checkedin') ? (
                            <Button
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold shadow-sm transition-all active:scale-95"
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
                                    guestName: mainGuest.primerNombre ? `${mainGuest.primerNombre} ${mainGuest.primerApellido}` : "",
                                    roomNumber: reservation.roomId,
                                    checkIn: new Date(reservation.checkIn || reservation.startDate),
                                    checkOut: new Date(reservation.checkOut || reservation.endDate),
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
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 transition-colors ${isActive ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground'}`}>
                                    {isActive ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{step}</span>
                                {index !== 3 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${isActive ? 'bg-primary' : 'bg-border'}`} />
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
                                    <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">General</TabsTrigger>
                                    <TabsTrigger value="huespedes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Huéspedes ({displayGuests.length})</TabsTrigger>
                                    <TabsTrigger value="finance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Finanzas</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="general" className="space-y-6 mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="bg-card border-border">
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase flex gap-2"><Calendar className="h-4 w-4 text-primary" /> Detalles</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center mb-4">
                                                <div><p className="text-xs text-muted-foreground">Check-In</p><p className="text-lg font-bold text-foreground">{reservation.checkIn ? format(new Date(reservation.checkIn), "dd MMM", { locale: es }) : '---'}</p></div>
                                                <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                                                <div className="text-right"><p className="text-xs text-muted-foreground">Check-Out</p><p className="text-lg font-bold text-foreground">{reservation.checkOut ? format(new Date(reservation.checkOut), "dd MMM", { locale: es }) : '---'}</p></div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">{reservation.adults} Adultos, {reservation.children} Niños</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-card border-border">
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase flex gap-2"><Bed className="h-4 w-4 text-primary" /> Habitación</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-start">
                                                <div><div className="text-3xl font-bold text-foreground mb-1">{reservation.roomId}</div><p className="text-sm text-muted-foreground">{reservation.roomName}</p></div>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full mt-4 border-border text-xs hover:bg-accent" onClick={() => setIsChangeRoomOpen(true)}><ArrowRightLeft className="h-3 w-3 mr-2" /> Cambiar</Button>
                                        </CardContent>
                                    </Card>
                                </div>
                                <Card className="bg-card border-border">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase flex gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Notas</CardTitle></CardHeader>
                                    <CardContent><div className="bg-muted border-l-4 border-primary p-4 rounded-r-md"><p className="text-sm italic text-foreground">"{reservation.notes || "Sin notas."}"</p></div></CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="huespedes">
                                <ReservationGuestList
                                    guests={displayGuests}
                                    maxGuests={totalCapacity}
                                    onAddGuest={() => setEditingGuest({ id: `new-${Date.now()}`, primerNombre: "", primerApellido: "", correo: "", telefono: "", tipoId: "CC", numeroId: "", esTitular: false, isSigned: false } as Guest)}
                                    onEditGuest={setEditingGuest}
                                    onSignGuest={() => toast("Firma")}
                                />
                            </TabsContent>

                            <TabsContent value="finance">
                                <Card className="bg-card border-border">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                                        <div className="space-y-1"><CardTitle className="text-base text-foreground">Cargos</CardTitle><CardDescription className="text-xs">Folio #{reservation.folioId || "Pendiente"}</CardDescription></div>
                                        <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10" onClick={goToFolios}><FileText className="h-4 w-4 mr-2" /> Ver Folio</Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-muted">
                                                <TableRow className="border-border">
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Concepto</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {displayFolioItems.map((item: any) => (
                                                    <TableRow key={item.id} className="hover:bg-accent/50 border-border">
                                                        <TableCell className="text-xs font-mono text-muted-foreground">{item.date}</TableCell>
                                                        <TableCell className="text-xs text-foreground">{item.concept}</TableCell>
                                                        <TableCell className="text-xs font-bold text-right text-foreground">${item.price.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {displayFolioItems.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">No hay transacciones en el folio aún.</TableCell>
                                                    </TableRow>
                                                )}
                                                <TableRow className="bg-muted border-t-2 border-border">
                                                    <TableCell colSpan={2} className="text-right text-xs font-bold uppercase text-foreground">Total de Reserva</TableCell>
                                                    <TableCell className="text-right text-sm font-bold text-primary">${reservation.totalAmount.toLocaleString()}</TableCell>
                                                </TableRow>
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
                            <div className="bg-muted p-4 border-b border-border flex justify-between items-center">
                                <span className="font-semibold text-foreground">Balance</span>
                                <Badge variant={pendingAmount > 0 ? "destructive" : "default"} className="uppercase text-[10px]">{pendingAmount > 0 ? "Pendiente" : "Pagado"}</Badge>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-lg font-bold"><span className="text-foreground">Total</span><span className="text-primary">$ {reservation.totalAmount.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-xs text-muted-foreground"><span>Pagado: $ {reservation.paidAmount.toLocaleString()}</span><span>{percentPaid.toFixed(0)}%</span></div>
                                    <Progress value={percentPaid} className="h-2 bg-border" indicatorColor="bg-green-500" />
                                </div>
                                {pendingAmount > 0 && (
                                    <div className="bg-destructive/10 border border-destructive/20 rounded p-3 flex gap-2 items-start">
                                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                        <div className="flex-1"><p className="text-xs text-destructive font-medium">Saldo Pendiente</p><p className="text-sm font-bold text-destructive">$ {pendingAmount.toLocaleString()}</p></div>
                                    </div>
                                )}
                                <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-semibold" onClick={() => { setCurrentBalance(pendingAmount); setShowPaymentModal(true); }}>
                                    <CreditCard className="h-4 w-4 mr-2" /> Registrar Pago
                                </Button>
                                <Button variant="link" className="w-full text-muted-foreground text-xs hover:text-foreground" onClick={goToFolios}>Ir a Facturación <ExternalLink className="ml-1 h-3 w-3" /></Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3 border-b border-border/50"><CardTitle className="text-sm font-medium text-muted-foreground uppercase flex gap-2"><Users className="h-4 w-4 text-primary" /> Titular</CardTitle></CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-12 w-12 border border-primary/30"><AvatarFallback className="bg-muted text-primary font-bold">{mainGuest.primerNombre ? mainGuest.primerNombre[0] : "?"}</AvatarFallback></Avatar>
                                    <div><p className="font-bold text-sm text-foreground">{mainGuest.primerNombre || "Desconocido"} {mainGuest.primerApellido || ""}</p><p className="text-xs text-muted-foreground">ID: {mainGuest.numeroId || "---"}</p></div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => mainGuest.correo && handleCopy(mainGuest.correo, "Email")}><Mail className="h-4 w-4" /> <span className="truncate">{mainGuest.correo || "Sin correo"}</span></div>
                                    <div className="flex items-center gap-3 text-muted-foreground"><Phone className="h-4 w-4" /> <span>{mainGuest.telefono || "Sin teléfono"}</span></div>
                                </div>
                                <Separator className="bg-border my-4" />
                                <Button size="sm" variant="outline" className="w-full border-border text-xs hover:bg-accent hover:text-accent-foreground" onClick={handleWhatsApp} disabled={!mainGuest.telefono}>WhatsApp</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}