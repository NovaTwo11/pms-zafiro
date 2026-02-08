"use client"

import { useState } from "react"
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
    Save, User, Briefcase, Globe, LogOut
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
    DialogTrigger,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

// Componentes importados (asegúrate de que existan en tu proyecto)
import { CheckinWizard } from "@/components/checkin-wizard"
import { ReservationGuestList } from "./reservation-guest-list"

// --- INTERFACES & MOCK DATA ---

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

// Datos simulados iniciales
const initialReservationData: any = {
    id: "RES-2026-001",
    checkInCode: "ZAF-8821",
    roomId: "101",
    roomName: "Suite Deluxe - Vista Mar",
    status: "confirmada",
    statusStep: 2, // 1: Reservada, 2: Confirmada, 3: Hospedado, 4: Finalizada
    startDate: "2026-02-10",
    endDate: "2026-02-15",
    adults: 2,
    children: 1,
    totalAmount: 720000,
    paidAmount: 360000,
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
        { id: 1, date: "2026-02-10", concept: "Noche de Alojamiento (Suite Deluxe)", qty: 1, price: 180000, total: 180000 },
        { id: 2, date: "2026-02-11", concept: "Noche de Alojamiento (Suite Deluxe)", qty: 1, price: 180000, total: 180000 },
        { id: 3, date: "2026-02-12", concept: "Noche de Alojamiento (Suite Deluxe)", qty: 1, price: 180000, total: 180000 },
        { id: 4, date: "2026-02-10", concept: "Servicio a la habitación - Cena", qty: 1, price: 45000, total: 45000 },
    ]
}

interface ReservationDetailsContentProps {
    reservationId: string
}

export function ReservationDetailsContent({ reservationId }: ReservationDetailsContentProps) {
    const router = useRouter()

    // State principal de la reserva (inicializado con mock)
    const [reservation, setReservation] = useState(initialReservationData)

    const [activeTab, setActiveTab] = useState("general")
    const [isCheckinWizardOpen, setIsCheckinWizardOpen] = useState(false)

    // Estados de Modales
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [isChangeRoomOpen, setIsChangeRoomOpen] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    // Estado para Edición de Huésped (Guarda el objeto huésped o null)
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null)

    // Cálculos
    const nights = differenceInDays(new Date(reservation.endDate), new Date(reservation.startDate))
    const totalCapacity = reservation.adults + reservation.children
    const pendingAmount = reservation.totalAmount - reservation.paidAmount
    const percentPaid = (reservation.paidAmount / reservation.totalAmount) * 100

    // Handlers
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado`)
    }

    const handleWhatsApp = () => {
        const phone = reservation.guests[0].telefono.replace(/[^0-9]/g, "")
        window.open(`https://wa.me/${phone}`, "_blank")
    }

    const goToFolios = () => {
        // Redirige al módulo de folios filtrando por esta reserva
        router.push(`/folios?reservationId=${reservationId}`)
    }

    const handleCancelReservation = () => {
        setIsCancelling(true)
        setTimeout(() => {
            setIsCancelling(false)
            setIsCancelDialogOpen(false)
            setReservation({ ...reservation, status: "cancelada", statusStep: 4 }) // Simulación
            toast.error("Reserva Cancelada", { description: "Se ha notificado al canal de venta." })
        }, 1500)
    }

    const handleSaveGuestData = (e: React.FormEvent) => {
        e.preventDefault()
        // Aquí iría la lógica de guardar en Backend (PUT /api/guests/{id})

        // Simulación de actualización local
        const updatedGuests = reservation.guests.map((g: Guest) =>
            g.id === editingGuest?.id ? { ...g, ...editingGuest } : g
        )
        setReservation({ ...reservation, guests: updatedGuests })

        toast.success("Datos actualizados", { description: `Se guardó la información de ${editingGuest?.primerNombre}` })
        setEditingGuest(null)
    }

    const handleCheckinComplete = (data: any) => {
        setIsCheckinWizardOpen(false)
        // Actualizar estado local a "Hospedado"
        setReservation({
            ...reservation,
            status: "hospedado",
            statusStep: 3
        })
        toast.success("Check-in completado", { description: "La habitación ahora está ocupada y el folio activo." })
    }

    // Mapeo de pasos de estado
    const steps = ['Reservada', 'Confirmada', 'Hospedado', 'Finalizada']

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto">

            {/* --- MODAL DE EDICIÓN DE HUÉSPED --- */}
            <Dialog open={!!editingGuest} onOpenChange={(open) => !open && setEditingGuest(null)}>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-[700px] h-[85vh] p-0 flex flex-col">
                    <DialogHeader className="px-6 py-4 border-b border-border">
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <User className="h-5 w-5 text-[#D4AF37]" /> Editar Datos del Huésped
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Completa todos los campos necesarios para el registro hotelero y facturación.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 px-6 py-4">
                        <form id="guest-form" onSubmit={handleSaveGuestData} className="space-y-6">

                            {/* SECCIÓN 1: IDENTIFICACIÓN */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                                    <User className="h-3 w-3" /> Información Personal
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Primer Nombre</Label>
                                        <Input
                                            value={editingGuest?.primerNombre || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, primerNombre: e.target.value} : null)}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Segundo Nombre</Label>
                                        <Input
                                            value={editingGuest?.segundoNombre || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, segundoNombre: e.target.value} : null)}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Primer Apellido</Label>
                                        <Input
                                            value={editingGuest?.primerApellido || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, primerApellido: e.target.value} : null)}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Segundo Apellido</Label>
                                        <Input
                                            value={editingGuest?.segundoApellido || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, segundoApellido: e.target.value} : null)}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Tipo Documento</Label>
                                        <Select
                                            value={editingGuest?.tipoId || "CC"}
                                            onValueChange={(val) => setEditingGuest(prev => prev ? {...prev, tipoId: val} : null)}
                                        >
                                            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-card border-border text-foreground">
                                                <SelectItem value="CC">Cédula (CC)</SelectItem>
                                                <SelectItem value="CE">Cédula Ext. (CE)</SelectItem>
                                                <SelectItem value="PP">Pasaporte (PP)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs text-muted-foreground">Número de Documento</Label>
                                        <Input
                                            value={editingGuest?.numeroId || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, numeroId: e.target.value} : null)}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Fecha Nacimiento</Label>
                                        <Input
                                            type="date"
                                            value={editingGuest?.fechaNacimiento || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, fechaNacimiento: e.target.value} : null)}
                                            className="bg-background border-border block"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Nacionalidad</Label>
                                        <Input
                                            value={editingGuest?.nacionalidad || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, nacionalidad: e.target.value} : null)}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-[#333333]" />

                            {/* SECCIÓN 2: CONTACTO Y PROFESIÓN */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                                    <Briefcase className="h-3 w-3" /> Datos Complementarios
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Teléfono / Móvil</Label>
                                        <Input
                                            value={editingGuest?.telefono || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, telefono: e.target.value} : null)}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Correo Electrónico</Label>
                                        <Input
                                            value={editingGuest?.correo || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, correo: e.target.value} : null)}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs text-muted-foreground">Ocupación / Profesión</Label>
                                        <Input
                                            value={editingGuest?.ocupacion || ""}
                                            onChange={(e) => setEditingGuest(prev => prev ? {...prev, ocupacion: e.target.value} : null)}
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-[#333333]" />

                            {/* SECCIÓN 3: UBICACIÓN */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                                    <Globe className="h-3 w-3" /> Ubicación
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Procedencia */}
                                    <div className="space-y-3 p-3 border border-border rounded-lg bg-[#262626]/50">
                                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Lugar de Procedencia</span>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">País</Label>
                                            <Input
                                                value={editingGuest?.paisOrigen || ""}
                                                onChange={(e) => setEditingGuest(prev => prev ? {...prev, paisOrigen: e.target.value} : null)}
                                                className="bg-background border-border h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Ciudad</Label>
                                            <Input
                                                value={editingGuest?.ciudadOrigen || ""}
                                                onChange={(e) => setEditingGuest(prev => prev ? {...prev, ciudadOrigen: e.target.value} : null)}
                                                className="bg-background border-border h-8 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Residencia */}
                                    <div className="space-y-3 p-3 border border-border rounded-lg bg-[#262626]/50">
                                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Lugar de Residencia</span>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">País</Label>
                                            <Input
                                                value={editingGuest?.paisResidencia || ""}
                                                onChange={(e) => setEditingGuest(prev => prev ? {...prev, paisResidencia: e.target.value} : null)}
                                                className="bg-background border-border h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Ciudad</Label>
                                            <Input
                                                value={editingGuest?.ciudadResidencia || ""}
                                                onChange={(e) => setEditingGuest(prev => prev ? {...prev, ciudadResidencia: e.target.value} : null)}
                                                className="bg-background border-border h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Dirección</Label>
                                            <Input
                                                value={editingGuest?.direccionResidencia || ""}
                                                onChange={(e) => setEditingGuest(prev => prev ? {...prev, direccionResidencia: e.target.value} : null)}
                                                className="bg-background border-border h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </ScrollArea>

                    <DialogFooter className="px-6 py-4 border-t border-border bg-card">
                        <Button variant="ghost" onClick={() => setEditingGuest(null)} className="border-0 text-muted-foreground hover:text-white hover:bg-[#333333]">
                            Cancelar
                        </Button>
                        <Button type="submit" form="guest-form" className="bg-primary text-black hover:bg-[#B5952F] min-w-[120px]">
                            <Save className="h-4 w-4 mr-2" /> Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MODAL CANCELAR --- */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent className="bg-card border-border text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de cancelar esta reserva?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Esta acción no se puede deshacer. Se liberará la habitación {reservation.roomId}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border hover:bg-[#333333] hover:text-white">Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleCancelReservation() }}
                            className="bg-red-900/50 text-red-200 hover:bg-red-900 border border-red-900"
                            disabled={isCancelling}
                        >
                            {isCancelling ? "Cancelando..." : "Sí, Cancelar Reserva"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- MODAL PAGO --- */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#D4AF37]">
                            <DollarSign className="h-5 w-5" /> Registrar Nuevo Pago
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Ingresa los detalles del pago recibido para la habitación {reservation.roomId}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monto a Pagar</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input type="number" className="pl-7 bg-background border-border" defaultValue={pendingAmount} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Método de Pago</Label>
                                <Select>
                                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        <SelectItem value="efectivo">Efectivo</SelectItem>
                                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                        <SelectItem value="transferencia">Transferencia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notas Internas</Label>
                            <Textarea placeholder="Detalles..." className="bg-background border-border resize-none" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentOpen(false)} className="border-border text-foreground hover:bg-[#333333]">Cancelar</Button>
                        <Button className="bg-primary text-black hover:bg-[#B5952F]">Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MODAL CAMBIO HABITACIÓN --- */}
            <Dialog open={isChangeRoomOpen} onOpenChange={setIsChangeRoomOpen}>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <ArrowRightLeft className="h-5 w-5 text-[#D4AF37]" /> Cambio de Habitación
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Mover reserva actual de la <strong>{reservation.roomId}</strong> a una nueva unidad.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Buscar disponibilidad</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Filtrar..." className="pl-9 bg-background border-border" />
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {[{ id: "102", type: "Suite Deluxe", status: "Limpia", price: 180000 }, { id: "205", type: "Junior Suite", status: "Sucia", price: 150000 }].map((room) => (
                                <div key={room.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-[#262626] hover:border-[#D4AF37] cursor-pointer transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-card rounded flex items-center justify-center font-bold text-white group-hover:text-[#D4AF37]">{room.id}</div>
                                        <div><p className="text-sm font-medium text-foreground">{room.type}</p><p className="text-xs text-muted-foreground">{room.status}</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-sm font-bold text-foreground">${room.price.toLocaleString()}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsChangeRoomOpen(false)} className="text-muted-foreground hover:text-white">Cancelar</Button>
                        <Button className="bg-[#E5E5E5] text-black hover:bg-card">Aplicar Cambio</Button>
                    </DialogFooter>
                </DialogContent>
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
                                <Badge variant="outline" className="border-[#D4AF37] text-[#D4AF37] bg-primary/10 px-2 py-0.5 text-xs uppercase tracking-wider">
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
                                <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                                <DropdownMenuItem className="hover:bg-[#333333] cursor-pointer" onClick={() => handleCopy("https://hotel-zafiro.com/pre-checkin/" + reservation.checkInCode, "Link Pre-Checkin")}>
                                    <LinkIcon className="h-4 w-4 mr-2" /> Copiar Link Pre-Checkin
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-[#333333] cursor-pointer" onClick={() => toast.success("Correo enviado")}>
                                    <Mail className="h-4 w-4 mr-2" /> Reenviar Confirmación
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#333333]" />
                                <DropdownMenuItem
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer focus:bg-red-900/20 focus:text-red-300"
                                    onClick={() => setIsCancelDialogOpen(true)}
                                >
                                    <XCircle className="h-4 w-4 mr-2" /> Cancelar Reserva
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Botón dinámico según estado */}
                        {reservation.statusStep < 3 ? (
                            <Button
                                className="bg-primary text-black hover:bg-[#B5952F] font-semibold shadow-lg shadow-amber-900/20"
                                onClick={() => setIsCheckinWizardOpen(true)}
                            >
                                Check-In
                            </Button>
                        ) : reservation.statusStep === 3 ? (
                            <Button
                                className="bg-red-600 text-white hover:bg-red-700 font-semibold shadow-lg shadow-red-900/20"
                                onClick={() => router.push(`/folios?reservationId=${reservationId}`)}
                            >
                                <LogOut className="h-4 w-4 mr-2" /> Check-Out
                            </Button>
                        ) : null}

                        {/* Componente Wizard */}
                        {isCheckinWizardOpen && (
                            <CheckinWizard
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

                {/* Progress Bar de Estado */}
                <div className="mt-6 flex items-center justify-between max-w-3xl mx-auto pb-2">
                    {steps.map((step, index) => {
                        const stepNum = index + 1;
                        const isActive = stepNum <= reservation.statusStep;
                        const isCurrent = stepNum === reservation.statusStep;
                        return (
                            <div key={step} className="flex flex-col items-center relative flex-1">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 transition-colors ${isActive ? 'bg-primary border-[#D4AF37] text-black' : 'bg-card border-border text-[#555]'}`}>
                                    {isActive ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-[#D4AF37]' : 'text-[#737373]'}`}>{step}</span>
                                {index !== 3 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${isActive ? 'bg-primary' : 'bg-[#333333]'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </header>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1 p-6 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                    {/* COLUMNA IZQUIERDA */}
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
                                    {/* Card: Detalles de Estadía */}
                                    <Card className="bg-card border-border">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-[#D4AF37]" /> Detalles de Estadía
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="text-xs text-[#737373]">Check-In</p>
                                                    <p className="text-lg font-bold text-foreground">{format(new Date(reservation.startDate), "dd MMM yyyy", { locale: es })}</p>
                                                </div>
                                                <div className="flex flex-col items-center px-4">
                                                    <div className="bg-[#333333] text-muted-foreground text-xs px-2 py-1 rounded-full mb-1">{nights} Noches</div>
                                                    <ArrowLeft className="h-4 w-4 text-[#555] rotate-180" />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-[#737373]">Check-Out</p>
                                                    <p className="text-lg font-bold text-foreground">{format(new Date(reservation.endDate), "dd MMM yyyy", { locale: es })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>{reservation.adults} Adultos, {reservation.children} Niños</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Card: Habitación Asignada */}
                                    <Card className="bg-card border-border">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
                                                <Bed className="h-4 w-4 text-[#D4AF37]" /> Habitación Asignada
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="text-3xl font-bold text-white mb-1">{reservation.roomId}</div>
                                                    <p className="text-sm text-muted-foreground">{reservation.roomName}</p>
                                                </div>
                                                <Badge className="bg-green-900/20 text-green-400 border-green-900">Limpia</Badge>
                                            </div>
                                            <div className="mt-4">
                                                <Button variant="outline" size="sm" className="w-full border-border hover:bg-[#333333] text-xs text-foreground" onClick={() => setIsChangeRoomOpen(true)}>
                                                    <ArrowRightLeft className="h-3 w-3 mr-2" /> Cambiar Habitación
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Card: Notas */}
                                <Card className="bg-card border-border">
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-[#D4AF37]" /> Notas de Recepción
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#333333]"><Edit className="h-3 w-3 text-muted-foreground" /></Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-[#262626] border-l-4 border-[#D4AF37] p-4 rounded-r-md">
                                            <p className="text-sm text-foreground leading-relaxed italic">"{reservation.notes}"</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="huespedes">
                                <ReservationGuestList
                                    guests={reservation.guests}
                                    maxGuests={totalCapacity}
                                    onAddGuest={() => setEditingGuest({
                                        id: `new-${Date.now()}`,
                                        primerNombre: "", primerApellido: "",
                                        correo: "", telefono: "",
                                        tipoId: "CC", numeroId: "",
                                        esTitular: false, isSigned: false
                                    } as Guest)}
                                    onEditGuest={(guestData: any) => setEditingGuest(guestData)}
                                    onSignGuest={(id: string, isSigned: boolean) => {
                                        if(isSigned) toast("Visualizando Firma")
                                        else toast("Abriendo Pad de Firma...")
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="finance">
                                <Card className="bg-card border-border">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base text-foreground">Detalle de Cargos</CardTitle>
                                            <CardDescription className="text-xs text-muted-foreground">Pre-visualización de Folio #{reservation.id}</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" className="border-[#D4AF37] text-[#D4AF37] hover:bg-primary/10" onClick={goToFolios}>
                                            <FileText className="h-4 w-4 mr-2" /> Ver Folio Completo
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-[#262626]">
                                                <TableRow className="border-border hover:bg-[#262626]">
                                                    <TableHead className="text-muted-foreground text-xs uppercase">Fecha</TableHead>
                                                    <TableHead className="text-muted-foreground text-xs uppercase w-[50%]">Concepto</TableHead>
                                                    <TableHead className="text-muted-foreground text-xs uppercase text-right">Cant</TableHead>
                                                    <TableHead className="text-muted-foreground text-xs uppercase text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reservation.folioItems.map((item: any) => (
                                                    <TableRow key={item.id} className="border-border hover:bg-[#333333]/50">
                                                        <TableCell className="text-xs text-foreground font-mono">{item.date}</TableCell>
                                                        <TableCell className="text-xs text-foreground">{item.concept}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground text-right">{item.qty}</TableCell>
                                                        <TableCell className="text-xs text-foreground text-right font-bold">$ {item.price.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-[#262626] border-t-2 border-border hover:bg-[#262626]">
                                                    <TableCell colSpan={3} className="text-right text-xs font-bold text-muted-foreground uppercase">Total Cargos</TableCell>
                                                    <TableCell className="text-right text-sm font-bold text-[#D4AF37]">$ {reservation.totalAmount.toLocaleString()}</TableCell>
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
                            <div className="bg-[#262626] p-4 border-b border-border flex justify-between items-center">
                                <span className="font-semibold text-foreground">Balance</span>
                                <Badge variant={pendingAmount > 0 ? "destructive" : "default"} className="uppercase text-[10px]">
                                    {pendingAmount > 0 ? "Pendiente" : "Pagado"}
                                </Badge>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className="text-white">Total</span>
                                        <span className="text-[#D4AF37]">$ {reservation.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Pagado: $ {reservation.paidAmount.toLocaleString()}</span>
                                        <span>{percentPaid.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={percentPaid} className="h-2 bg-[#333333]" indicatorColor="bg-green-500" />
                                </div>
                                {pendingAmount > 0 && (
                                    <div className="bg-red-900/10 border border-red-900/30 rounded p-3 flex gap-2 items-start">
                                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-red-400 font-medium">Saldo Pendiente</p>
                                            <p className="text-sm font-bold text-red-500">$ {pendingAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                                <Button className="w-full bg-[#E5E5E5] text-black hover:bg-card font-semibold" onClick={() => setIsPaymentOpen(true)}>
                                    <CreditCard className="h-4 w-4 mr-2" /> Registrar Pago
                                </Button>
                                <Button variant="link" className="w-full text-muted-foreground text-xs h-auto hover:text-foreground" onClick={goToFolios}>
                                    Ir a Folios & Facturación <ExternalLink className="ml-1 h-3 w-3" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
                                    <Users className="h-4 w-4 text-[#D4AF37]" /> Titular
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-12 w-12 border border-[#D4AF37]/30">
                                        <AvatarFallback className="bg-[#262626] text-[#D4AF37] font-bold">
                                            {reservation.guests[0].primerNombre[0]}{reservation.guests[0].primerApellido[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-foreground text-sm">
                                            {reservation.guests[0].primerNombre} {reservation.guests[0].primerApellido}
                                        </p>
                                        <p className="text-xs text-[#737373]">ID: {reservation.guests[0].numeroId}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 text-muted-foreground cursor-pointer hover:text-white" onClick={() => handleCopy(reservation.guests[0].correo, "Email")}>
                                        <Mail className="h-4 w-4" /> <span className="truncate">{reservation.guests[0].correo}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Phone className="h-4 w-4" /> <span>{reservation.guests[0].telefono}</span>
                                    </div>
                                </div>
                                <Separator className="bg-[#333333] my-4" />
                                <Button size="sm" variant="outline" className="w-full border-border text-xs text-foreground" onClick={handleWhatsApp}>
                                    WhatsApp
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}