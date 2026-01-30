"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    ArrowLeft, Mail, Link as LinkIcon, Printer,
    Edit, MoreVertical, CreditCard, UserPlus
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Componentes internos (que definiremos abajo)
import { ReservationGeneralInfo } from "./reservation-general-info"
import { ReservationGuestList } from "./reservation-guest-list"
import { ReservationFinanceCard } from "./reservation-finance-card" // Reutilizamos/Mejoramos

// Importamos tipos (simulados por ahora para no romper el build si no tienes el archivo types localmente en el mismo path)
import type { Reservation, ReservationStatus } from "@/types"

// --- MOCK DATA COMPLETO ---
const mockReservation: any = {
    id: "RES-2026-001",
    checkInCode: "ZAF-8821",
    roomId: "101",
    status: "confirmada_abono",
    startDate: "2026-01-03",
    endDate: "2026-01-07",
    totalAmount: 720000,
    paidAmount: 360000,
    checkedIn: false,
    origin: "Booking.com", // Dato extra común en PMS
    notes: "Cliente solicita almohadas extra. Alérgico al maní.",
    guests: [
        {
            id: "g1",
            primerNombre: "Carlos",
            segundoNombre: "Andrés",
            primerApellido: "García",
            segundoApellido: "Márquez",
            tipoId: "CC",
            numeroId: "1098765432",
            nacionalidad: "Colombiano",
            fechaCumpleanos: "1990-05-15",
            telefono: "+57 300 123 4567",
            correo: "carlos.garcia@email.com",
            ocupacion: "Ingeniero de Sistemas",
            genero: "M",
            paisResidencia: "Colombia",
            ciudadResidencia: "Bogotá",
            paisOrigen: "Colombia",
            ciudadOrigen: "Medellín",
            paisDestino: "Colombia",
            ciudadDestino: "Cali",
            esTitular: true
        }
    ]
}

interface ReservationDetailsContentProps {
    reservationId: string
}

export function ReservationDetailsContent({ reservationId }: ReservationDetailsContentProps) {
    const [emailSending, setEmailSending] = useState(false)

    const handleSendPreCheckin = () => {
        const link = `${window.location.origin}/guest/check-in/${mockReservation.checkInCode}`
        // Aquí iría la lógica real de envío o copiado
        navigator.clipboard.writeText(link)
        alert(`Link copiado al portapapeles: ${link}`)
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* --- HEADER TIPO RIBBON --- */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#333333] pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/cronograma">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A3A3A3] hover:text-[#E5E5E5]">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-[#E5E5E5]">Reserva #{mockReservation.id}</h1>
                            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/50 hover:bg-blue-600/30">
                                Confirmada (Abono)
                            </Badge>
                        </div>
                        <p className="text-xs text-[#A3A3A3] mt-0.5">
                            Creada el 02 Ene 2026 • Origen: <span className="text-[#D4AF37]">{mockReservation.origin}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-[#333333] text-[#A3A3A3]" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" /> Imprimir
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5">
                                Acciones <MoreVertical className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#333333]">
                            <DropdownMenuItem onClick={handleSendPreCheckin}>
                                <LinkIcon className="h-4 w-4 mr-2" /> Copiar Link Pre-Checkin
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" /> Reenviar Confirmación
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 focus:text-red-400">
                                Cancelar Reserva
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button size="sm" className="bg-[#059669] text-white hover:bg-[#059669]/90 font-semibold shadow-lg shadow-green-900/20">
                        Check-In
                    </Button>
                </div>
            </div>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <Tabs defaultValue="general" className="flex-1 space-y-4">
                <TabsList className="bg-[#1A1A1A] border border-[#333333] p-1">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="huespedes">Huéspedes ({mockReservation.guests.length})</TabsTrigger>
                    <TabsTrigger value="estado_cuenta">Estado de Cuenta</TabsTrigger>
                    <TabsTrigger value="bitacora">Bitácora</TabsTrigger>
                </TabsList>

                {/* TAB 1: GENERAL */}
                <TabsContent value="general" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Columna Izquierda: Datos Principales */}
                        <div className="lg:col-span-2 space-y-4">
                            <ReservationGeneralInfo reservation={mockReservation} />
                            {/* Notas / Observaciones */}
                            <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold text-[#A3A3A3] uppercase">Notas de Reserva</h3>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Edit className="h-3 w-3" /></Button>
                                </div>
                                <p className="text-sm text-[#E5E5E5] bg-[#0F0F0F] p-3 rounded border border-[#333333]/50 min-h-[80px]">
                                    {mockReservation.notes}
                                </p>
                            </div>
                        </div>

                        {/* Columna Derecha: Resumen Financiero Rápido */}
                        <div className="space-y-4">
                            <ReservationFinanceCard financial={{
                                total: mockReservation.totalAmount,
                                paid: mockReservation.paidAmount,
                                pending: mockReservation.totalAmount - mockReservation.paidAmount
                            }} />

                            {/* Card de Titular Rápido */}
                            <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-[#A3A3A3] uppercase mb-3">Titular</h3>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold">
                                        {mockReservation.guests[0].primerNombre[0]}{mockReservation.guests[0].primerApellido[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#E5E5E5]">{mockReservation.guests[0].primerNombre} {mockReservation.guests[0].primerApellido}</p>
                                        <p className="text-xs text-[#A3A3A3]">{mockReservation.guests[0].correo}</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="w-full text-xs border-[#333333]">Ver Perfil CRM</Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: HUESPEDES (Detallado) */}
                <TabsContent value="huespedes">
                    <ReservationGuestList guests={mockReservation.guests} maxGuests={4} />
                </TabsContent>

                {/* TAB 3: ESTADO DE CUENTA (Placeholder) */}
                <TabsContent value="estado_cuenta">
                    <div className="flex items-center justify-center h-40 bg-[#1A1A1A] border border-[#333333] rounded-lg text-[#A3A3A3]">
                        Módulo de Folios (Ver componentes/folios-content.tsx)
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}