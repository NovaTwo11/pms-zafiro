"use client"

import { useState, useEffect } from "react"
import { Plus, Search, BedDouble, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FolioCard } from "./folio-card"
import { FolioDrawer } from "./folio-drawer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Interfaces alineadas con el DTO del backend
interface Folio {
  id: string
  type: "guest" | "external"
  // Campos comunes
  status: string
  balance: number
  // Campos de Guest
  guestName?: string
  roomNumber?: string
  checkIn?: Date
  checkOut?: Date
  nights?: number
  // Campos Externos
  alias?: string
  description?: string
  createdAt?: Date
}

export function FoliosContent() {
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("guests")
  const [newFolioModal, setNewFolioModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Data states
  const [guestFolios, setGuestFolios] = useState<Folio[]>([])
  const [externalFolios, setExternalFolios] = useState<Folio[]>([])
  const [newFolioData, setNewFolioData] = useState({ alias: "", description: "" })

  // Fetch Data
  const fetchFolios = async () => {
    setLoading(true)
    try {
      // Fetch Huéspedes (GuestFolios)
      const resGuests = await fetch("/api/folios/active-guests")
      if (resGuests.ok) {
        const data = await resGuests.json()
        setGuestFolios(data.map((d: any) => ({
          ...d,
          type: "guest",
          checkIn: new Date(d.checkIn),
          checkOut: new Date(d.checkOut)
        })))
      }

      // Fetch Externos (ExternalFolios)
      const resExternal = await fetch("/api/folios/active-externals")
      if (resExternal.ok) {
        const data = await resExternal.json()
        setExternalFolios(data.map((d: any) => ({
          ...d,
          type: "external",
          createdAt: new Date(d.createdAt)
        })))
      }
    } catch (error) {
      console.error("Error fetching folios", error)
      toast.error("Error al cargar los folios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFolios()
  }, [])

  // Selección del folio actual para el Drawer
  const currentFolio =
      activeTab === "guests"
          ? guestFolios.find(f => f.id === selectedFolioId)
          : externalFolios.find(f => f.id === selectedFolioId)

  // Filtrado
  const filteredGuestFolios = guestFolios.filter(
      (f) => f.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) || f.roomNumber?.includes(searchQuery),
  )

  const filteredExternalFolios = externalFolios.filter(
      (f) =>
          f.alias?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateFolio = async () => {
    try {
      const res = await fetch("/api/folios/external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFolioData)
      })

      if (!res.ok) throw new Error("Error al crear folio")

      toast.success("Folio externo creado exitosamente")
      setNewFolioModal(false)
      setNewFolioData({ alias: "", description: "" })
      fetchFolios() // Recargar lista
    } catch (error) {
      toast.error("No se pudo crear el folio")
    }
  }

  return (
      <>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-foreground">Folios</h1>
              <p className="text-muted-foreground">Gestión de cuentas y consumos</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o habitación..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[280px] pl-9 bg-card border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
                />
              </div>
              <Button
                  onClick={() => setNewFolioModal(true)}
                  className="bg-primary text-[#0F0F0F] hover:bg-primary/90 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Folio
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card border border-border p-1">
              <TabsTrigger
                  value="guests"
                  className={cn(
                      "data-[state=active]:bg-primary/10 data-[state=active]:text-[#D4AF37] text-muted-foreground transition-all duration-300",
                  )}
              >
                <BedDouble className="h-4 w-4 mr-2" />
                Huéspedes en Casa ({guestFolios.length})
              </TabsTrigger>
              <TabsTrigger
                  value="external"
                  className={cn(
                      "data-[state=active]:bg-primary/10 data-[state=active]:text-[#D4AF37] text-muted-foreground transition-all duration-300",
                  )}
              >
                <Users className="h-4 w-4 mr-2" />
                Pasadías / Externos ({externalFolios.length})
              </TabsTrigger>
            </TabsList>

            {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                  {/* Guest Folios */}
                  <TabsContent value="guests" className="mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredGuestFolios.map((folio) => (
                          <FolioCard
                              key={folio.id}
                              folio={folio as any} // Cast temporal si FolioCard espera tipos estrictos
                              isSelected={selectedFolioId === folio.id}
                              onClick={() => setSelectedFolioId(folio.id)}
                          />
                      ))}
                    </div>
                    {filteredGuestFolios.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">No hay folios de huéspedes activos</p>
                        </div>
                    )}
                  </TabsContent>

                  {/* External Folios */}
                  <TabsContent value="external" className="mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredExternalFolios.map((folio) => (
                          <FolioCard
                              key={folio.id}
                              folio={folio as any}
                              isSelected={selectedFolioId === folio.id}
                              onClick={() => setSelectedFolioId(folio.id)}
                          />
                      ))}
                    </div>
                    {filteredExternalFolios.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">No hay folios externos registrados</p>
                        </div>
                    )}
                  </TabsContent>
                </>
            )}
          </Tabs>
        </div>

        {/* Detail Drawer */}
        {/* Se asume que FolioDrawer hace sus propias llamadas para obtener transacciones usando el ID */}
        <FolioDrawer
            folio={currentFolio as any}
            isOpen={!!selectedFolioId}
            onClose={() => setSelectedFolioId(null)}
        />

        <Dialog open={newFolioModal} onOpenChange={setNewFolioModal}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-foreground">
                Nuevo Folio Externo
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Crea una cuenta para pasadías o clientes externos sin habitación asignada.
              </p>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Nombre / Alias *</Label>
                <Input
                    value={newFolioData.alias}
                    onChange={(e) => setNewFolioData({ ...newFolioData, alias: e.target.value })}
                    placeholder="Ej: Familia Pérez, Empresa XYZ"
                    className="bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] resize-none transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Descripción</Label>
                <Textarea
                    value={newFolioData.description}
                    onChange={(e) => setNewFolioData({ ...newFolioData, description: e.target.value })}
                    placeholder="Ej: Evento de cumpleaños, uso de piscina..."
                    className="bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] resize-none transition-all duration-300"
                    rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                    variant="outline"
                    onClick={() => setNewFolioModal(false)}
                    className="flex-1 border-border text-foreground hover:bg-accent bg-transparent transition-all duration-300"
                >
                  Cancelar
                </Button>
                <Button
                    onClick={handleCreateFolio}
                    disabled={!newFolioData.alias}
                    className="flex-1 bg-primary text-[#0F0F0F] hover:bg-primary/90 transition-all duration-300"
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