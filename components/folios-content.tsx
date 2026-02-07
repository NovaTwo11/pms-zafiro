"use client"

import { useState } from "react"
import { Plus, Search, BedDouble, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FolioCard } from "./folio-card"
import { FolioDrawer } from "./folio-drawer"
import { cn } from "@/lib/utils"

// Sample data
const guestFolios = [
  {
    id: "f1",
    type: "guest" as const,
    roomNumber: "201",
    guestName: "Sr. García Mendoza",
    balance: 485000,
    checkIn: new Date(2026, 0, 3),
    checkOut: new Date(2026, 0, 7),
    nights: 4,
    status: "in-house" as const,
  },
  {
    id: "f2",
    type: "guest" as const,
    roomNumber: "102",
    guestName: "Sra. Martínez López",
    balance: 120000,
    checkIn: new Date(2026, 0, 5),
    checkOut: new Date(2026, 0, 9),
    nights: 4,
    status: "in-house" as const,
  },
  {
    id: "f3",
    type: "guest" as const,
    roomNumber: "305",
    guestName: "Sr. Rodríguez Pérez",
    balance: 0,
    checkIn: new Date(2026, 0, 2),
    checkOut: new Date(2026, 0, 8),
    nights: 6,
    status: "in-house" as const,
  },
  {
    id: "f4",
    type: "guest" as const,
    roomNumber: "203",
    guestName: "Sra. Hernández Villa",
    balance: 850000,
    checkIn: new Date(2026, 0, 4),
    checkOut: new Date(2026, 0, 10),
    nights: 6,
    status: "in-house" as const,
  },
  {
    id: "f5",
    type: "guest" as const,
    roomNumber: "304",
    guestName: "Sr. Díaz Sánchez",
    balance: 280000,
    checkIn: new Date(2026, 0, 3),
    checkOut: new Date(2026, 0, 6),
    nights: 3,
    status: "in-house" as const,
  },
]

const externalFolios = [
  {
    id: "e1",
    type: "external" as const,
    alias: "Familia Pérez",
    description: "Evento de cumpleaños",
    balance: 320000,
    createdAt: new Date(2026, 0, 5),
  },
  {
    id: "e2",
    type: "external" as const,
    alias: "Empresa ABC Corp",
    description: "Almuerzo ejecutivo",
    balance: 580000,
    createdAt: new Date(2026, 0, 4),
  },
  {
    id: "e3",
    type: "external" as const,
    alias: "Sr. López (Pasadía)",
    description: "Uso de piscina",
    balance: 75000,
    createdAt: new Date(2026, 0, 5),
  },
  {
    id: "e4",
    type: "external" as const,
    alias: "Sr. Segura (Evento)",
    description: "Uso de instalaciones",
    balance: 0,
    createdAt: new Date(2026, 0, 6),
  },
]

export function FoliosContent() {
  const [selectedFolio, setSelectedFolio] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("guests")
  const [newFolioModal, setNewFolioModal] = useState(false)
  const [newFolioData, setNewFolioData] = useState({ alias: "", description: "" })

  const selectedGuestFolio = guestFolios.find((f) => f.id === selectedFolio)
  const selectedExternalFolio = externalFolios.find((f) => f.id === selectedFolio)
  const currentFolio = selectedGuestFolio || selectedExternalFolio

  const filteredGuestFolios = guestFolios.filter(
    (f) => f.guestName.toLowerCase().includes(searchQuery.toLowerCase()) || f.roomNumber.includes(searchQuery),
  )

  const filteredExternalFolios = externalFolios.filter(
    (f) =>
      f.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateFolio = () => {
    console.log("Creating new external folio:", newFolioData)
    setNewFolioModal(false)
    setNewFolioData({ alias: "", description: "" })
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[#E5E5E5]">Folios</h1>
            <p className="text-[#A3A3A3]">Gestión de cuentas y consumos</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]" />
              <Input
                placeholder="Buscar por nombre o habitación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[280px] pl-9 bg-[#1A1A1A] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
              />
            </div>
            <Button
              onClick={() => setNewFolioModal(true)}
              className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Folio
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1A1A1A] border border-[#333333] p-1">
            <TabsTrigger
              value="guests"
              className={cn(
                "data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#A3A3A3] transition-all duration-300",
              )}
            >
              <BedDouble className="h-4 w-4 mr-2" />
              Huéspedes en Casa ({guestFolios.length})
            </TabsTrigger>
            <TabsTrigger
              value="external"
              className={cn(
                "data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#A3A3A3] transition-all duration-300",
              )}
            >
              <Users className="h-4 w-4 mr-2" />
              Pasadías / Externos ({externalFolios.length})
            </TabsTrigger>
          </TabsList>

          {/* Guest Folios */}
          <TabsContent value="guests" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredGuestFolios.map((folio) => (
                <FolioCard
                  key={folio.id}
                  folio={folio}
                  isSelected={selectedFolio === folio.id}
                  onClick={() => setSelectedFolio(folio.id)}
                />
              ))}
            </div>
            {filteredGuestFolios.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#A3A3A3]">No se encontraron folios con ese criterio</p>
              </div>
            )}
          </TabsContent>

          {/* External Folios */}
          <TabsContent value="external" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredExternalFolios.map((folio) => (
                <FolioCard
                  key={folio.id}
                  folio={folio}
                  isSelected={selectedFolio === folio.id}
                  onClick={() => setSelectedFolio(folio.id)}
                />
              ))}
            </div>
            {filteredExternalFolios.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#A3A3A3]">No se encontraron folios externos</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Drawer */}
      <FolioDrawer folio={currentFolio} isOpen={!!selectedFolio} onClose={() => setSelectedFolio(null)} />

      <Dialog open={newFolioModal} onOpenChange={setNewFolioModal}>
        <DialogContent className="sm:max-w-[400px] bg-[#1A1A1A] border-[#333333]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5]">
              Nuevo Folio Externo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <p className="text-sm text-[#A3A3A3]">
              Crea una cuenta para pasadías o clientes externos sin habitación asignada.
            </p>

            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Nombre / Alias *</Label>
              <Input
                value={newFolioData.alias}
                onChange={(e) => setNewFolioData({ ...newFolioData, alias: e.target.value })}
                placeholder="Ej: Familia Pérez, Empresa XYZ"
                className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37] resize-none transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Descripción</Label>
              <Textarea
                value={newFolioData.description}
                onChange={(e) => setNewFolioData({ ...newFolioData, description: e.target.value })}
                placeholder="Ej: Evento de cumpleaños, uso de piscina..."
                className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37] resize-none transition-all duration-300"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setNewFolioModal(false)}
                className="flex-1 border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent transition-all duration-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateFolio}
                disabled={!newFolioData.alias}
                className="flex-1 bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
              >
                Crear Folio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
