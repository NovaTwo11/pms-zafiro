"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, Search, Filter, MoreHorizontal, FileText, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GuestFormDrawer } from "./guest-form-drawer"
import { cn } from "@/lib/utils"

// Sample guests data
const guests = [
  {
    id: "g1",
    firstName: "Carlos",
    lastName: "García Mendoza",
    email: "carlos.garcia@email.com",
    phone: "+57 300 123 4567",
    nationality: "Colombia",
    documentType: "CC",
    documentNumber: "1234567890",
    dateOfBirth: new Date(1985, 5, 15),
    totalStays: 5,
    lastStay: new Date(2026, 0, 5),
    status: "in-house" as const,
  },
  {
    id: "g2",
    firstName: "María",
    lastName: "Martínez López",
    email: "maria.martinez@email.com",
    phone: "+57 310 234 5678",
    nationality: "Colombia",
    documentType: "CC",
    documentNumber: "9876543210",
    dateOfBirth: new Date(1990, 2, 22),
    totalStays: 2,
    lastStay: new Date(2026, 0, 5),
    status: "in-house" as const,
  },
  {
    id: "g3",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "+1 555 123 4567",
    nationality: "Estados Unidos",
    documentType: "Pasaporte",
    documentNumber: "US12345678",
    passportNumber: "US12345678",
    entryDate: new Date(2026, 0, 1),
    dateOfBirth: new Date(1978, 8, 10),
    totalStays: 1,
    lastStay: new Date(2026, 0, 5),
    status: "in-house" as const,
  },
  {
    id: "g4",
    firstName: "Ana",
    lastName: "Rodríguez Pérez",
    email: "ana.rodriguez@email.com",
    phone: "+57 320 345 6789",
    nationality: "Colombia",
    documentType: "CC",
    documentNumber: "5555666677",
    dateOfBirth: new Date(1995, 11, 3),
    totalStays: 8,
    lastStay: new Date(2025, 11, 20),
    status: "previous" as const,
  },
  {
    id: "g5",
    firstName: "Pierre",
    lastName: "Dubois",
    email: "pierre.dubois@email.fr",
    phone: "+33 6 12 34 56 78",
    nationality: "Francia",
    documentType: "Pasaporte",
    documentNumber: "FR98765432",
    passportNumber: "FR98765432",
    entryDate: new Date(2026, 0, 3),
    dateOfBirth: new Date(1982, 3, 18),
    totalStays: 3,
    lastStay: new Date(2026, 0, 5),
    status: "in-house" as const,
  },
]

export function HuespedesContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGuest, setSelectedGuest] = useState<(typeof guests)[0] | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isNewGuest, setIsNewGuest] = useState(false)

  const filteredGuests = guests.filter(
    (g) =>
      g.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.documentNumber.includes(searchQuery),
  )

  const handleNewGuest = () => {
    setSelectedGuest(null)
    setIsNewGuest(true)
    setDrawerOpen(true)
  }

  const handleEditGuest = (guest: (typeof guests)[0]) => {
    setSelectedGuest(guest)
    setIsNewGuest(false)
    setDrawerOpen(true)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-[#E5E5E5]">Huéspedes</h1>
            <p className="text-[#A3A3A3]">Gestión de perfiles y datos legales</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]" />
              <Input
                placeholder="Buscar por nombre o documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[280px] pl-9 bg-[#1A1A1A] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37]"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="border-[#333333] bg-[#1A1A1A] text-[#A3A3A3] hover:bg-[#252525] hover:text-[#E5E5E5]"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={handleNewGuest} className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Huésped
            </Button>
          </div>
        </div>

        {/* Guests Table */}
        <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#333333] bg-[#0F0F0F]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                    Huésped
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                    Nacionalidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                    Estadías
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="border-b border-[#333333] last:border-0 hover:bg-[#252525] transition-colors cursor-pointer"
                    onClick={() => handleEditGuest(guest)}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#E5E5E5]">
                          {guest.firstName} {guest.lastName}
                        </p>
                        <p className="text-xs text-[#A3A3A3]">{guest.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-[#E5E5E5]">{guest.documentNumber}</p>
                      <p className="text-xs text-[#A3A3A3]">{guest.documentType}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-[#E5E5E5]">{guest.nationality}</p>
                      {guest.nationality !== "Colombia" && guest.entryDate && (
                        <p className="text-xs text-[#D4AF37]">
                          Entrada: {format(guest.entryDate, "dd MMM yyyy", { locale: es })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-[#E5E5E5]">{guest.phone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-[#E5E5E5]">{guest.totalStays} visitas</p>
                      <p className="text-xs text-[#A3A3A3]">
                        Última: {format(guest.lastStay, "dd MMM yyyy", { locale: es })}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          guest.status === "in-house"
                            ? "bg-[#3B82F6]/10 text-[#3B82F6]"
                            : "bg-[#A3A3A3]/10 text-[#A3A3A3]",
                        )}
                      >
                        {guest.status === "in-house" ? "En casa" : "Anterior"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#333333]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1A1A1A] border-[#333333]" align="end">
                          <DropdownMenuItem className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5]">
                            <FileText className="h-4 w-4 mr-2" />
                            Generar Contrato
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#333333]" />
                          <DropdownMenuItem className="text-[#CF6679] focus:bg-[#CF6679]/10 focus:text-[#CF6679]">
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Anonimizar Datos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredGuests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#A3A3A3]">No se encontraron huéspedes con ese criterio</p>
            </div>
          )}
        </div>
      </div>

      {/* Guest Form Drawer */}
      <GuestFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        guest={selectedGuest}
        isNew={isNewGuest}
      />
    </>
  )
}
