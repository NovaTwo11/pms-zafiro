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
    Save, User, Briefcase, Flag, Globe
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
import { ScrollArea } from "@/components/ui/scroll-area" // Necesario para forms largos

import { ReservationGuestList } from "./reservation-guest-list"

// --- MOCK DATA ---
const mockReservation: any = {
    id: "RES-2026-001",
    checkInCode: "ZAF-8821",
    roomId: "101",
    roomName: "Suite Deluxe - Vista Mar",
    status: "confirmada",
    statusStep: 2,
    startDate: "2026-01-03",
    endDate: "2026-01-07",
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
            tipoId: "CC",
            numeroId: "1098765432",
            nacionalidad: "Colombiano",
            ocupacion: "Ingeniero",
            fechaNacimiento: "1990-05-15",
            esTitular: true,
            isSigned: true
        }
    ],
    folioItems: [
        { id: 1, date: "2026-01-03", concept: "Noche de Alojamiento (Suite Deluxe)", qty: 1, price: 180000, total: 180000 },
        { id: 2, date: "2026-01-04", concept: "Noche de Alojamiento (Suite Deluxe)", qty: 1, price: 180000, total: 180000 },
        { id: 3, date: "2026-01-05", concept: "Noche de Alojamiento (Suite Deluxe)", qty: 1, price: 180000, total: 180000 },
        { id: 4, date: "2026-01-06", concept: "Noche de Alojamiento (Suite Deluxe)", qty: 1, price: 180000, total: 180000 },
        { id: 5, date: "2026-01-03", concept: "Servicio a la habitación - Cena", qty: 1, price: 45000, total: 45000 },
    ]
}

interface ReservationDetailsContentProps {
    reservationId: string
}

export function ReservationDetailsContent({ reservationId }: ReservationDetailsContentProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("general")

    // Estados de Modales
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [isChangeRoomOpen, setIsChangeRoomOpen] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    // Estado para Edición de Huésped (Guarda el objeto huésped o null)
    const [editingGuest, setEditingGuest] = useState<any | null>(null)

    // Cálculos
    const nights = differenceInDays(new Date(mockReservation.endDate), new Date(mockReservation.startDate))
    const totalCapacity = mockReservation.adults + mockReservation.children
    const pendingAmount = mockReservation.totalAmount - mockReservation.paidAmount
    const percentPaid = (mockReservation.paidAmount / mockReservation.totalAmount) * 100

    // Handlers
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado`)
    }

    const handleWhatsApp = () => {
        const phone = mockReservation.guests[0].telefono.replace(/[^0-9]/g, "")
        window.open(`https://wa.me/${phone}`, "_blank")
    }

    const goToFolios = () => {
        router.push(`/folios?reservationId=${reservationId}&guestId=${mockReservation.guests[0].id}`)
    }

    const handleCancelReservation = () => {
        setIsCancelling(true)
        setTimeout(() => {
            setIsCancelling(false)
            setIsCancelDialogOpen(false)
            toast.error("Reserva Cancelada", { description: "Se ha notificado al canal de venta." })
        }, 2000)
    }

    const handleSaveGuestData = (e: React.FormEvent) => {
        e.preventDefault()
        // Aquí iría la lógica de guardar en Backend
        toast.success("Datos actualizados", { description: `Se guardó la información de ${editingGuest.primerNombre}` })
        setEditingGuest(null)
    }

    return (
        <div className="flex flex-col h-full bg-[#0F0F0F] text-[#E5E5E5] overflow-y-auto">

            {/* --- MODAL DE EDICIÓN DE HUÉSPED (NUEVO) --- */}
            <Dialog open={!!editingGuest} onOpenChange={(open) => !open && setEditingGuest(null)}>
                <DialogContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5] sm:max-w-[700px] h-[85vh] p-0 flex flex-col">
                    <DialogHeader className="px-6 py-4 border-b border-[#333333]">
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <User className="h-5 w-5 text-[#D4AF37]" /> Editar Datos del Huésped
                        </DialogTitle>
                        <DialogDescription className="text-[#A3A3A3]">
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
                                        <Label className="text-xs text-[#A3A3A3]">Primer Nombre</Label>
                                        <Input defaultValue={editingGuest?.primerNombre} className="bg-[#0F0F0F] border-[#333333]" placeholder="Ej: Carlos" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-[#A3A3A3]">Segundo Nombre</Label>
                                        <Input defaultValue={editingGuest?.segundoNombre} className="bg-[#0F0F0F] border-[#333333]" placeholder="Ej: Andrés" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-[#A3A3A3]">Primer Apellido</Label>
                                        <Input defaultValue={editingGuest?.primerApellido} className="bg-[#0F0F0F] border-[#333333]" placeholder="Ej: García" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-[#A3A3A3]">Segundo Apellido</Label>
                                        <Input defaultValue={editingGuest?.segundoApellido} className="bg-[#0F0F0F] border-[#333333]" placeholder="Ej: Márquez" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-[#A3A3A3]">Tipo Documento</Label>
                                        <Select defaultValue={editingGuest?.tipoId || "CC"}>
                                            <SelectTrigger className="bg-[#0F0F0F] border-[#333333]"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                                                <SelectItem value="CC">Cédula (CC)</SelectItem>
                                                <SelectItem value="CE">Cédula Ext. (CE)</SelectItem>
                                                <SelectItem value="PP">Pasaporte (PP)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs text-[#A3A3A3]">Número de Documento</Label>
                                        <Input defaultValue={editingGuest?.numeroId} className="bg-[#0F0F0F] border-[#333333]" placeholder="Ej: 1098..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-[#A3A3A3]">Fecha Nacimiento</Label>
                                        <Input type="date" defaultValue={editingGuest?.fechaNacimiento} className="bg-[#0F0F0F] border-[#333333] block" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-[#A3A3A3]">Nacionalidad</Label>
                                        <Input defaultValue={editingGuest?.nacionalidad} className="bg-[#0F0F0F] border-[#333333]" placeholder="Ej: Colombiano" />
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
                                        <Label className="text-xs text-[#A3A3A3]">Teléfono / Móvil</Label>
                                        <Input defaultValue={editingGuest?.telefono} className="bg-[#0F0F0F] border-[#333333]" placeholder="+57..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-[#A3A3A3]">Correo Electrónico</Label>
                                        <Input defaultValue={editingGuest?.correo} className="bg-[#0F0F0F] border-[#333333]" placeholder="correo@ejemplo.com" />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs text-[#A3A3A3]">Ocupación / Profesión</Label>
                                        <Input defaultValue={editingGuest?.ocupacion} className="bg-[#0F0F0F] border-[#333333]" placeholder="Ej: Ingeniero, Estudiante..." />
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
                                    <div className="space-y-3 p-3 border border-[#333333] rounded-lg bg-[#262626]/50">
                                        <span className="text-[10px] uppercase text-[#A3A3A3] font-bold">Lugar de Procedencia</span>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-[#A3A3A3]">País</Label>
                                            <Input defaultValue={editingGuest?.paisOrigen} className="bg-[#0F0F0F] border-[#333333] h-8 text-xs" placeholder="País" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-[#A3A3A3]">Ciudad</Label>
                                            <Input defaultValue={editingGuest?.ciudadOrigen} className="bg-[#0F0F0F] border-[#333333] h-8 text-xs" placeholder="Ciudad" />
                                        </div>
                                    </div>

                                    {/* Residencia */}
                                    <div className="space-y-3 p-3 border border-[#333333] rounded-lg bg-[#262626]/50">
                                        <span className="text-[10px] uppercase text-[#A3A3A3] font-bold">Lugar de Residencia</span>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-[#A3A3A3]">País</Label>
                                            <Input defaultValue={editingGuest?.paisResidencia} className="bg-[#0F0F0F] border-[#333333] h-8 text-xs" placeholder="País" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-[#A3A3A3]">Ciudad</Label>
                                            <Input defaultValue={editingGuest?.ciudadResidencia} className="bg-[#0F0F0F] border-[#333333] h-8 text-xs" placeholder="Ciudad" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-[#A3A3A3]">Dirección</Label>
                                            <Input defaultValue={editingGuest?.direccionResidencia} className="bg-[#0F0F0F] border-[#333333] h-8 text-xs" placeholder="Dirección completa" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </ScrollArea>

                    <DialogFooter className="px-6 py-4 border-t border-[#333333] bg-[#1A1A1A]">
                        <Button variant="ghost" onClick={() => setEditingGuest(null)} className="border-0 text-[#A3A3A3] hover:text-white hover:bg-[#333333]">
                            Cancelar
                        </Button>
                        <Button type="submit" form="guest-form" className="bg-[#D4AF37] text-black hover:bg-[#B5952F] min-w-[120px]">
                            <Save className="h-4 w-4 mr-2" /> Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MODALES EXISTENTES (CANCEL, PAYMENT, CHANGE ROOM) --- */}
            {/* ... (Aquí van los otros Dialogs que ya tenías: Cancel, Payment, ChangeRoom. No los repito para no saturar, pero deben estar aquí) ... */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                {/* ... Código del AlertDialog ... */}
                <AlertDialogContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de cancelar esta reserva?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#A3A3A3]">
                            Esta acción no se puede deshacer. Se liberará la habitación {mockReservation.roomId}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-[#333333] hover:bg-[#333333] hover:text-white">Volver</AlertDialogCancel>
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

            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5] sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#D4AF37]">
                            <DollarSign className="h-5 w-5" /> Registrar Nuevo Pago
                        </DialogTitle>
                        <DialogDescription className="text-[#A3A3A3]">
                            Ingresa los detalles del pago recibido para la habitación {mockReservation.roomId}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monto a Pagar</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-[#A3A3A3]">$</span>
                                    <Input type="number" className="pl-7 bg-[#0F0F0F] border-[#333333]" defaultValue={pendingAmount} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Método de Pago</Label>
                                <Select>
                                    <SelectTrigger className="bg-[#0F0F0F] border-[#333333]"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                                        <SelectItem value="efectivo">Efectivo</SelectItem>
                                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                        <SelectItem value="transferencia">Transferencia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notas Internas</Label>
                            <Textarea placeholder="Detalles..." className="bg-[#0F0F0F] border-[#333333] resize-none" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentOpen(false)} className="border-[#333333] text-[#E5E5E5] hover:bg-[#333333]">Cancelar</Button>
                        <Button className="bg-[#D4AF37] text-black hover:bg-[#B5952F]">Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isChangeRoomOpen} onOpenChange={setIsChangeRoomOpen}>
                <DialogContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5] sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <ArrowRightLeft className="h-5 w-5 text-[#D4AF37]" /> Cambio de Habitación
                        </DialogTitle>
                        <DialogDescription className="text-[#A3A3A3]">
                            Mover reserva actual de la <strong>{mockReservation.roomId}</strong> a una nueva unidad.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Buscar disponibilidad</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A3A3A3]" />
                                <Input placeholder="Filtrar..." className="pl-9 bg-[#0F0F0F] border-[#333333]" />
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {[{ id: "102", type: "Suite Deluxe", status: "Limpia", price: 180000 }, { id: "205", type: "Junior Suite", status: "Sucia", price: 150000 }].map((room) => (
                                <div key={room.id} className="flex items-center justify-between p-3 rounded-lg border border-[#333333] bg-[#262626] hover:border-[#D4AF37] cursor-pointer transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-[#1A1A1A] rounded flex items-center justify-center font-bold text-white group-hover:text-[#D4AF37]">{room.id}</div>
                                        <div><p className="text-sm font-medium text-[#E5E5E5]">{room.type}</p><p className="text-xs text-[#A3A3A3]">{room.status}</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-sm font-bold text-[#E5E5E5]">${room.price.toLocaleString()}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsChangeRoomOpen(false)} className="text-[#A3A3A3] hover:text-white">Cancelar</Button>
                        <Button className="bg-[#E5E5E5] text-black hover:bg-white">Aplicar Cambio</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- HEADER PRINCIPAL --- */}
            <header className="bg-[#1A1A1A] border-b border-[#333333] px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/cronograma">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#333333]">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-white">Reserva #{mockReservation.id}</h1>
                                <Badge variant="outline" className="border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 text-xs uppercase tracking-wider">Confirmada</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mt-1">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Creada: {format(new Date(mockReservation.createdDate), "dd MMM yyyy", { locale: es })}</span>
                                <span>•</span>
                                <span className="text-[#D4AF37]">Canal: {mockReservation.origin}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-[#333333] text-[#E5E5E5] bg-[#1A1A1A] hover:bg-[#333333]">
                                    Acciones <MoreVertical className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                                <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                                <DropdownMenuItem className="hover:bg-[#333333] cursor-pointer" onClick={() => handleCopy("https://...", "Link Pre-Checkin")}>
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

                        <Button className="bg-[#D4AF37] text-black hover:bg-[#B5952F] font-semibold shadow-lg shadow-amber-900/20" onClick={() => router.push('/checkin/' + reservationId)}>
                            Check-In
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between max-w-3xl mx-auto pb-2">
                    {['Reservada', 'Confirmada', 'Hospedado', 'Finalizada'].map((step, index) => {
                        const stepNum = index + 1;
                        const isActive = stepNum <= mockReservation.statusStep;
                        const isCurrent = stepNum === mockReservation.statusStep;
                        return (
                            <div key={step} className="flex flex-col items-center relative flex-1">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 transition-colors ${isActive ? 'bg-[#D4AF37] border-[#D4AF37] text-black' : 'bg-[#1A1A1A] border-[#333333] text-[#555]'}`}>
                                    {isActive ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-[#D4AF37]' : 'text-[#737373]'}`}>{step}</span>
                                {index !== 3 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${isActive ? 'bg-[#D4AF37]' : 'bg-[#333333]'}`} />
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
                                <TabsList className="bg-[#1A1A1A] border border-[#333333] h-10">
                                    <TabsTrigger value="general" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">General</TabsTrigger>
                                    <TabsTrigger value="huespedes" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">Huéspedes ({mockReservation.guests.length})</TabsTrigger>
                                    <TabsTrigger value="finance" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">Finanzas</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="general" className="space-y-6 mt-0">
                                {/* ... (Mismo contenido de General) ... */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="bg-[#1A1A1A] border-[#333333]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-[#A3A3A3] uppercase flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-[#D4AF37]" /> Detalles de Estadía
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="text-xs text-[#737373]">Check-In</p>
                                                    <p className="text-lg font-bold text-[#E5E5E5]">{format(new Date(mockReservation.startDate), "dd MMM yyyy", { locale: es })}</p>
                                                </div>
                                                <div className="flex flex-col items-center px-4">
                                                    <div className="bg-[#333333] text-[#A3A3A3] text-xs px-2 py-1 rounded-full mb-1">{nights} Noches</div>
                                                    <ArrowLeft className="h-4 w-4 text-[#555] rotate-180" />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-[#737373]">Check-Out</p>
                                                    <p className="text-lg font-bold text-[#E5E5E5]">{format(new Date(mockReservation.endDate), "dd MMM yyyy", { locale: es })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-[#A3A3A3]">
                                                <span>{mockReservation.adults} Adultos, {mockReservation.children} Niños</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-[#1A1A1A] border-[#333333]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-[#A3A3A3] uppercase flex items-center gap-2">
                                                <Bed className="h-4 w-4 text-[#D4AF37]" /> Habitación Asignada
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="text-3xl font-bold text-white mb-1">{mockReservation.roomId}</div>
                                                    <p className="text-sm text-[#A3A3A3]">{mockReservation.roomName}</p>
                                                </div>
                                                <Badge className="bg-green-900/20 text-green-400 border-green-900">Limpia</Badge>
                                            </div>
                                            <div className="mt-4">
                                                <Button variant="outline" size="sm" className="w-full border-[#333333] hover:bg-[#333333] text-xs text-[#E5E5E5]" onClick={() => setIsChangeRoomOpen(true)}>
                                                    <ArrowRightLeft className="h-3 w-3 mr-2" /> Cambiar Habitación
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                                <Card className="bg-[#1A1A1A] border-[#333333]">
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm font-medium text-[#A3A3A3] uppercase flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-[#D4AF37]" /> Notas de Recepción
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#333333]"><Edit className="h-3 w-3 text-[#A3A3A3]" /></Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-[#262626] border-l-4 border-[#D4AF37] p-4 rounded-r-md">
                                            <p className="text-sm text-[#E5E5E5] leading-relaxed italic">"{mockReservation.notes}"</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="huespedes">
                                <ReservationGuestList
                                    guests={mockReservation.guests}
                                    maxGuests={totalCapacity}
                                    // ABRIMOS EL DIALOG VACÍO PARA NUEVO
                                    onAddGuest={() => setEditingGuest({})}
                                    // ABRIMOS EL DIALOG CON DATOS PARA EDITAR
                                    // Buscamos el objeto guest completo en el mock (esto sería mejor pasarlo directo, ver archivo ReservationGuestList)
                                    onEditGuest={(guestData) => setEditingGuest(guestData)}
                                    onSignGuest={(id, isSigned) => {
                                        if(isSigned) toast("Visualizando Firma")
                                        else toast("Abriendo Pad de Firma...")
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="finance">
                                {/* ... (Mismo contenido de Finanzas) ... */}
                                <Card className="bg-[#1A1A1A] border-[#333333]">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-[#333333] pb-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base text-[#E5E5E5]">Detalle de Cargos</CardTitle>
                                            <CardDescription className="text-xs text-[#A3A3A3]">Pre-visualización de Folio #{mockReservation.id}</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10" onClick={goToFolios}>
                                            <FileText className="h-4 w-4 mr-2" /> Ver Folio Completo
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-[#262626]">
                                                <TableRow className="border-[#333333] hover:bg-[#262626]">
                                                    <TableHead className="text-[#A3A3A3] text-xs uppercase">Fecha</TableHead>
                                                    <TableHead className="text-[#A3A3A3] text-xs uppercase w-[50%]">Concepto</TableHead>
                                                    <TableHead className="text-[#A3A3A3] text-xs uppercase text-right">Cant</TableHead>
                                                    <TableHead className="text-[#A3A3A3] text-xs uppercase text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {mockReservation.folioItems.map((item: any) => (
                                                    <TableRow key={item.id} className="border-[#333333] hover:bg-[#333333]/50">
                                                        <TableCell className="text-xs text-[#E5E5E5] font-mono">{item.date}</TableCell>
                                                        <TableCell className="text-xs text-[#E5E5E5]">{item.concept}</TableCell>
                                                        <TableCell className="text-xs text-[#A3A3A3] text-right">{item.qty}</TableCell>
                                                        <TableCell className="text-xs text-[#E5E5E5] text-right font-bold">$ {item.total.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-[#262626] border-t-2 border-[#333333] hover:bg-[#262626]">
                                                    <TableCell colSpan={3} className="text-right text-xs font-bold text-[#A3A3A3] uppercase">Total Cargos</TableCell>
                                                    <TableCell className="text-right text-sm font-bold text-[#D4AF37]">$ {mockReservation.totalAmount.toLocaleString()}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* COLUMNA DERECHA */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* ... (Mismo contenido Sidebar) ... */}
                        <Card className="bg-[#1A1A1A] border-[#333333] overflow-hidden">
                            <div className="bg-[#262626] p-4 border-b border-[#333333] flex justify-between items-center">
                                <span className="font-semibold text-[#E5E5E5]">Balance</span>
                                <Badge variant={pendingAmount > 0 ? "destructive" : "default"} className="uppercase text-[10px]">
                                    {pendingAmount > 0 ? "Pendiente" : "Pagado"}
                                </Badge>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className="text-white">Total</span>
                                        <span className="text-[#D4AF37]">$ {mockReservation.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-[#A3A3A3]">
                                        <span>Pagado: $ {mockReservation.paidAmount.toLocaleString()}</span>
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
                                <Button className="w-full bg-[#E5E5E5] text-black hover:bg-white font-semibold" onClick={() => setIsPaymentOpen(true)}>
                                    <CreditCard className="h-4 w-4 mr-2" /> Registrar Pago
                                </Button>
                                <Button variant="link" className="w-full text-[#A3A3A3] text-xs h-auto hover:text-[#E5E5E5]" onClick={goToFolios}>
                                    Ir a Folios & Facturación <ExternalLink className="ml-1 h-3 w-3" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#1A1A1A] border-[#333333]">
                            <CardHeader className="pb-3 border-b border-[#333333]/50">
                                <CardTitle className="text-sm font-medium text-[#A3A3A3] uppercase flex items-center gap-2">
                                    <Users className="h-4 w-4 text-[#D4AF37]" /> Titular
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-12 w-12 border border-[#D4AF37]/30">
                                        <AvatarFallback className="bg-[#262626] text-[#D4AF37] font-bold">
                                            {mockReservation.guests[0].primerNombre[0]}{mockReservation.guests[0].primerApellido[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-[#E5E5E5] text-sm">
                                            {mockReservation.guests[0].primerNombre} {mockReservation.guests[0].primerApellido}
                                        </p>
                                        <p className="text-xs text-[#737373]">ID: {mockReservation.guests[0].numeroId}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 text-[#A3A3A3] cursor-pointer hover:text-white" onClick={() => handleCopy(mockReservation.guests[0].correo, "Email")}>
                                        <Mail className="h-4 w-4" /> <span className="truncate">{mockReservation.guests[0].correo}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[#A3A3A3]">
                                        <Phone className="h-4 w-4" /> <span>{mockReservation.guests[0].telefono}</span>
                                    </div>
                                </div>
                                <Separator className="bg-[#333333] my-4" />
                                <Button size="sm" variant="outline" className="w-full border-[#333333] text-xs text-[#E5E5E5]" onClick={handleWhatsApp}>
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