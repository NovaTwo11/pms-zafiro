"use client"

import { useState, useEffect } from "react"
import { Settings, Link2, Users, Upload, Check, AlertCircle, Trash2, Plus, Save, Hotel } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
// Importamos la API real
import { channelsApi, ChannelMapping } from "@/lib/api"

// Sample staff data (Mantenemos mock por ahora para usuarios)
const staffMembers = [
  { id: "1", name: "Juan Díaz", email: "juan@hotelzafiro.com", role: "admin" },
  { id: "2", name: "María García", email: "maria@hotelzafiro.com", role: "operator" },
  { id: "3", name: "Carlos López", email: "carlos@hotelzafiro.com", role: "operator" },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  // --- Estados Generales ---
  const [hotelData, setHotelData] = useState({
    name: "Hotel Zafiro",
    phone: "+57 1 234 5678",
    email: "info@hotelzafiro.com",
    address: "Calle 123 #45-67, Bogotá",
    facebook: "https://facebook.com/hotelzafiro",
    instagram: "@hotelzafiro",
    website: "https://hotelzafiro.com",
  })

  // --- Estados de Integración ---
  const [integrations, setIntegrations] = useState({
    factusToken: "",
    siigoToken: "",
    autoInvoice: false,
    bookingConnected: true, // Simulación: Ya estamos conectados (esto vendría de BD idealmente)
    bookingMachineId: "micros_pms_zafiro", // Simulación
  })

  const [staff, setStaff] = useState(staffMembers)

  // --- Estados para Mapeo de Habitaciones (REALES) ---
  const [roomCategories, setRoomCategories] = useState<string[]>([])
  const [mappings, setMappings] = useState<ChannelMapping[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Cargar datos reales al montar
  useEffect(() => {
    const fetchData = async () => {
      if (!integrations.bookingConnected) return;

      setIsLoading(true);
      try {
        // 1. Obtener categorías de habitaciones existentes en BD (Ej: "Doble", "Suite")
        const categories = await channelsApi.getRoomCategories();
        setRoomCategories(categories);

        // 2. Obtener mapeos guardados para Booking (ID 2)
        const currentMappings = await channelsApi.getMappings(2);
        setMappings(currentMappings);
      } catch (error) {
        console.error("Error cargando configuración:", error);
        toast.error("Error al cargar la configuración de canales");
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'integrations') {
      fetchData();
    }
  }, [activeTab, integrations.bookingConnected]);

  // Función para guardar un mapeo individual
  const handleSaveMapping = async (categoryName: string, externalId: string) => {
    try {
      const newMapping: ChannelMapping = {
        roomCategory: categoryName,
        externalRoomId: externalId,
        channel: 2 // BookingCom
      };

      await channelsApi.saveMapping(newMapping);

      // Actualizar estado local para reflejar cambio
      setMappings(prev => {
        const others = prev.filter(m => m.roomCategory !== categoryName)
        return [...others, newMapping]
      })

      toast.success(`Mapeo para ${categoryName} guardado correctamente`)
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el mapeo")
    }
  }

  return (
      <div className="space-y-6 pb-10">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración del hotel, integraciones y usuarios.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card border border-border rounded-lg p-1 h-auto grid grid-cols-3">
            <TabsTrigger
                value="general"
                className="py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground rounded-md transition-all duration-300"
            >
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger
                value="integrations"
                className="py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground rounded-md transition-all duration-300"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Integraciones
            </TabsTrigger>
            <TabsTrigger
                value="users"
                className="py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground rounded-md transition-all duration-300"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          {/* --- GENERAL TAB --- */}
          <TabsContent value="general" className="mt-6 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground mb-6">
                Información del Hotel
              </h3>

              {/* Hotel Logo */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
                <div className="h-24 w-24 rounded-xl bg-primary flex items-center justify-center shadow-inner">
                  <span className="font-[family-name:var(--font-logo)] text-4xl font-extrabold text-primary-foreground">Z</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Logo visible en facturas y correos</p>
                  <Button variant="outline" className="border-border text-foreground hover:bg-accent bg-transparent">
                    <Upload className="h-4 w-4 mr-2" />
                    Cambiar Logo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Hotel</Label>
                  <Input
                      value={hotelData.name}
                      onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                      value={hotelData.phone}
                      onChange={(e) => setHotelData({ ...hotelData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                      type="email"
                      value={hotelData.email}
                      onChange={(e) => setHotelData({ ...hotelData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sitio Web</Label>
                  <Input
                      value={hotelData.website}
                      onChange={(e) => setHotelData({ ...hotelData, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Dirección</Label>
                  <Input
                      value={hotelData.address}
                      onChange={(e) => setHotelData({ ...hotelData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Guardar Cambios</Button>
              </div>
            </div>
          </TabsContent>

          {/* --- INTEGRATIONS TAB --- */}
          <TabsContent value="integrations" className="mt-6 space-y-6">

            {/* Booking.com Section */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Hotel className="h-5 w-5 text-[#003580]" />
                      Booking.com
                    </CardTitle>
                    <CardDescription>Gestión de disponibilidad y tarifas (Channel Manager)</CardDescription>
                  </div>
                  <Badge variant={integrations.bookingConnected ? "default" : "destructive"} className={cn("text-xs px-3 py-1", integrations.bookingConnected ? "bg-[#003580] hover:bg-[#003580]/90" : "")}>
                    {integrations.bookingConnected ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Bar */}
                <div className={cn("flex items-center gap-4 p-4 rounded-lg border",
                    integrations.bookingConnected ? "bg-[#003580]/5 border-[#003580]/20" : "bg-destructive/5 border-destructive/20"
                )}>
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center",
                      integrations.bookingConnected ? "bg-[#003580] text-white" : "bg-destructive text-white"
                  )}>
                    {integrations.bookingConnected ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {integrations.bookingConnected ? "Sincronización Activa" : "Conexión Inactiva"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {integrations.bookingConnected
                          ? "Inventario y tarifas se actualizan automáticamente."
                          : "Conecte su cuenta para evitar overbookings."}
                    </p>
                  </div>
                  <Button variant="outline"
                          onClick={() => setIntegrations(prev => ({...prev, bookingConnected: !prev.bookingConnected}))}
                          className="border-border hover:bg-accent"
                  >
                    {integrations.bookingConnected ? "Desconectar" : "Conectar"}
                  </Button>
                </div>

                {integrations.bookingConnected && (
                    <>
                      {/* Credenciales (Ocultas/Masked en producción) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border pb-6">
                        <div className="space-y-2">
                          <Label>Machine ID (XML)</Label>
                          <Input value={integrations.bookingMachineId} readOnly className="bg-muted text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input type="password" value="********" readOnly className="bg-muted text-muted-foreground" />
                        </div>
                      </div>

                      {/* --- UI DE MAPEO (REQUERIMIENTO PRINCIPAL) --- */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">Mapeo de Habitaciones</h4>
                          <Button variant="ghost" size="sm" className="text-primary h-8">
                            <Check className="h-4 w-4 mr-2" />
                            Validar IDs
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground -mt-3">
                          Asocie sus categorías locales de PmsZafiro con los códigos de habitación de Booking.com (Room ID).
                        </p>

                        <div className="rounded-md border border-border">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="w-[300px]">Categoría PmsZafiro</TableHead>
                                <TableHead>Booking.com Room ID</TableHead>
                                <TableHead className="w-[100px] text-right">Acción</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {isLoading ? (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Cargando datos...</TableCell>
                                  </TableRow>
                              ) : roomCategories.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No hay categorías de habitación creadas.</TableCell>
                                  </TableRow>
                              ) : (
                                  roomCategories.map((catName) => {
                                    // Buscar si ya existe mapeo para esta categoría
                                    const mapping = mappings.find(m => m.roomCategory === catName);
                                    return (
                                        <MappingRow
                                            key={catName}
                                            categoryName={catName}
                                            initialValue={mapping?.externalRoomId || ""}
                                            onSave={handleSaveMapping}
                                        />
                                    );
                                  })
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                )}
              </CardContent>
            </Card>

            {/* Facturacion */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground mb-4">
                Facturación Electrónica
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Token Factus API</Label>
                  <Input
                      type="password"
                      value={integrations.factusToken}
                      onChange={(e) => setIntegrations({ ...integrations, factusToken: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Facturar automáticamente al Check-out</p>
                    <p className="text-xs text-muted-foreground">Genera factura DIAN inmediata al cerrar folio</p>
                  </div>
                  <Switch
                      checked={integrations.autoInvoice}
                      onCheckedChange={(checked) => setIntegrations({ ...integrations, autoInvoice: checked })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* --- USERS TAB --- */}
          <TabsContent value="users" className="mt-6 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground">Usuarios del Sistema</h3>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Usuario
                </Button>
              </div>

              <div className="space-y-3">
                {staff.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.name.substring(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select defaultValue={member.role}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="operator">Operador</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  )
}

// --- SUBCOMPONENTES ---

function MappingRow({ categoryName, initialValue, onSave }: { categoryName: string, initialValue: string, onSave: (cat: string, val: string) => void }) {
  const [value, setValue] = useState(initialValue)
  const [isChanged, setIsChanged] = useState(false)

  // Efecto para actualizar el input si la API devuelve un valor tardío
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setIsChanged(e.target.value !== initialValue)
  }

  const handleSave = () => {
    onSave(categoryName, value)
    setIsChanged(false)
  }

  return (
      <TableRow className="border-border">
        <TableCell className="font-medium">{categoryName}</TableCell>
        <TableCell>
          <Input
              placeholder="Ej. 4500213"
              value={value}
              onChange={handleChange}
              className="max-w-[200px] h-8 font-mono text-sm"
          />
        </TableCell>
        <TableCell className="text-right">
          {isChanged && (
              <Button size="sm" onClick={handleSave} className="h-8 bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="h-3.5 w-3.5" />
              </Button>
          )}
        </TableCell>
      </TableRow>
  )
}