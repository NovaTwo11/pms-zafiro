"use client"

import { useState } from "react"
import { Settings, Link2, Users, Upload, Check, AlertCircle, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Sample staff data
const staffMembers = [
  { id: "1", name: "Juan Díaz", email: "juan@hotelzafiro.com", role: "admin" },
  { id: "2", name: "María García", email: "maria@hotelzafiro.com", role: "operator" },
  { id: "3", name: "Carlos López", email: "carlos@hotelzafiro.com", role: "operator" },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [hotelData, setHotelData] = useState({
    name: "Hotel Zafiro",
    phone: "+57 1 234 5678",
    email: "info@hotelzafiro.com",
    address: "Calle 123 #45-67, Bogotá",
    facebook: "https://facebook.com/hotelzafiro",
    instagram: "@hotelzafiro",
    website: "https://hotelzafiro.com",
  })

  const [integrations, setIntegrations] = useState({
    factusToken: "",
    siigoToken: "",
    autoInvoice: false,
    bookingConnected: true,
  })

  const [staff, setStaff] = useState(staffMembers)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Administra la configuración del hotel y las integraciones</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-card border border-border rounded-lg p-1 h-auto">
          <TabsTrigger
            value="general"
            className="flex-1 py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-[#D4AF37] text-muted-foreground rounded-md transition-all duration-300"
          >
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="flex-1 py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-[#D4AF37] text-muted-foreground rounded-md transition-all duration-300"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Integraciones
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex-1 py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-[#D4AF37] text-muted-foreground rounded-md transition-all duration-300"
          >
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground mb-6">
              Información del Hotel
            </h3>

            {/* Hotel Logo */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
              <div className="h-24 w-24 rounded-xl bg-primary flex items-center justify-center">
                <span className="font-[family-name:var(--font-logo)] text-4xl font-extrabold text-[#0F0F0F]">Z</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Logo del Hotel</p>
                <Button variant="outline" className="border-border text-foreground hover:bg-accent bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Cambiar Logo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nombre del Hotel</Label>
                <Input
                  value={hotelData.name}
                  onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Teléfono</Label>
                <Input
                  value={hotelData.phone}
                  onChange={(e) => setHotelData({ ...hotelData, phone: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={hotelData.email}
                  onChange={(e) => setHotelData({ ...hotelData, email: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Sitio Web</Label>
                <Input
                  value={hotelData.website}
                  onChange={(e) => setHotelData({ ...hotelData, website: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-muted-foreground">Dirección</Label>
                <Input
                  value={hotelData.address}
                  onChange={(e) => setHotelData({ ...hotelData, address: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <h4 className="font-medium text-foreground mt-6 mb-4">Redes Sociales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Facebook</Label>
                <Input
                  value={hotelData.facebook}
                  onChange={(e) => setHotelData({ ...hotelData, facebook: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Instagram</Label>
                <Input
                  value={hotelData.instagram}
                  onChange={(e) => setHotelData({ ...hotelData, instagram: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <Button className="mt-6 bg-primary text-[#0F0F0F] hover:bg-primary/90">Guardar Cambios</Button>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6 space-y-6">
          {/* Facturacion */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground mb-4">
              Facturación Electrónica
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Token Factus API</Label>
                <Input
                  type="password"
                  placeholder="Ingrese el token de Factus"
                  value={integrations.factusToken}
                  onChange={(e) => setIntegrations({ ...integrations, factusToken: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Token Siigo API (Alternativo)</Label>
                <Input
                  type="password"
                  placeholder="Ingrese el token de Siigo"
                  value={integrations.siigoToken}
                  onChange={(e) => setIntegrations({ ...integrations, siigoToken: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Facturar automáticamente al Check-out</p>
                  <p className="text-xs text-muted-foreground">Genera factura electrónica cuando el huésped hace check-out</p>
                </div>
                <Switch
                  checked={integrations.autoInvoice}
                  onCheckedChange={(checked) => setIntegrations({ ...integrations, autoInvoice: checked })}
                />
              </div>
            </div>
          </div>

          {/* Booking.com */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground mb-4">
              Channel Manager - Booking.com
            </h3>

            <div
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border",
                integrations.bookingConnected
                  ? "bg-[#059669]/10 border-[#059669]/30"
                  : "bg-[#CF6679]/10 border-[#CF6679]/30",
              )}
            >
              <div
                className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center",
                  integrations.bookingConnected ? "bg-[#059669]" : "bg-[#CF6679]",
                )}
              >
                {integrations.bookingConnected ? (
                  <Check className="h-6 w-6 text-white" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {integrations.bookingConnected ? "Conectado" : "Desconectado"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {integrations.bookingConnected
                    ? "Sincronización activa con Booking.com"
                    : "Configure la conexión con Booking.com"}
                </p>
              </div>
              <Button
                variant="outline"
                className={cn(
                  "border-border bg-transparent",
                  integrations.bookingConnected
                    ? "text-[#CF6679] hover:bg-[#CF6679]/10"
                    : "text-[#059669] hover:bg-[#059669]/10",
                )}
              >
                {integrations.bookingConnected ? "Desconectar" : "Conectar"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground">Usuarios del Sistema</h3>
              <Button className="bg-primary text-[#0F0F0F] hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Usuario
              </Button>
            </div>

            <div className="space-y-3">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-background"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-accent text-foreground">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select defaultValue={member.role}>
                      <SelectTrigger className="w-[140px] bg-card border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="admin" className="text-foreground focus:bg-accent">
                          Administrador
                        </SelectItem>
                        <SelectItem value="operator" className="text-foreground focus:bg-accent">
                          Operador
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#CF6679] hover:text-[#CF6679] hover:bg-[#CF6679]/10"
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
