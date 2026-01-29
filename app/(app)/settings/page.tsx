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
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[#E5E5E5]">Configuración</h1>
        <p className="text-[#A3A3A3]">Administra la configuración del hotel y las integraciones</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg p-1 h-auto">
          <TabsTrigger
            value="general"
            className="flex-1 py-3 text-sm data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#A3A3A3] rounded-md transition-all duration-300"
          >
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="flex-1 py-3 text-sm data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#A3A3A3] rounded-md transition-all duration-300"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Integraciones
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex-1 py-3 text-sm data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#A3A3A3] rounded-md transition-all duration-300"
          >
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5] mb-6">
              Información del Hotel
            </h3>

            {/* Hotel Logo */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#333333]">
              <div className="h-24 w-24 rounded-xl bg-[#D4AF37] flex items-center justify-center">
                <span className="font-[family-name:var(--font-logo)] text-4xl font-extrabold text-[#0F0F0F]">Z</span>
              </div>
              <div>
                <p className="text-sm text-[#A3A3A3] mb-2">Logo del Hotel</p>
                <Button variant="outline" className="border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Cambiar Logo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Nombre del Hotel</Label>
                <Input
                  value={hotelData.name}
                  onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Teléfono</Label>
                <Input
                  value={hotelData.phone}
                  onChange={(e) => setHotelData({ ...hotelData, phone: e.target.value })}
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Email</Label>
                <Input
                  type="email"
                  value={hotelData.email}
                  onChange={(e) => setHotelData({ ...hotelData, email: e.target.value })}
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Sitio Web</Label>
                <Input
                  value={hotelData.website}
                  onChange={(e) => setHotelData({ ...hotelData, website: e.target.value })}
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[#A3A3A3]">Dirección</Label>
                <Input
                  value={hotelData.address}
                  onChange={(e) => setHotelData({ ...hotelData, address: e.target.value })}
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
            </div>

            <h4 className="font-medium text-[#E5E5E5] mt-6 mb-4">Redes Sociales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Facebook</Label>
                <Input
                  value={hotelData.facebook}
                  onChange={(e) => setHotelData({ ...hotelData, facebook: e.target.value })}
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Instagram</Label>
                <Input
                  value={hotelData.instagram}
                  onChange={(e) => setHotelData({ ...hotelData, instagram: e.target.value })}
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
            </div>

            <Button className="mt-6 bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90">Guardar Cambios</Button>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6 space-y-6">
          {/* Facturacion */}
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5] mb-4">
              Facturación Electrónica
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Token Factus API</Label>
                <Input
                  type="password"
                  placeholder="Ingrese el token de Factus"
                  value={integrations.factusToken}
                  onChange={(e) => setIntegrations({ ...integrations, factusToken: e.target.value })}
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Token Siigo API (Alternativo)</Label>
                <Input
                  type="password"
                  placeholder="Ingrese el token de Siigo"
                  value={integrations.siigoToken}
                  onChange={(e) => setIntegrations({ ...integrations, siigoToken: e.target.value })}
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0F0F0F] border border-[#333333]">
                <div>
                  <p className="text-sm font-medium text-[#E5E5E5]">Facturar automáticamente al Check-out</p>
                  <p className="text-xs text-[#A3A3A3]">Genera factura electrónica cuando el huésped hace check-out</p>
                </div>
                <Switch
                  checked={integrations.autoInvoice}
                  onCheckedChange={(checked) => setIntegrations({ ...integrations, autoInvoice: checked })}
                />
              </div>
            </div>
          </div>

          {/* Booking.com */}
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5] mb-4">
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
                <p className="font-medium text-[#E5E5E5]">
                  {integrations.bookingConnected ? "Conectado" : "Desconectado"}
                </p>
                <p className="text-sm text-[#A3A3A3]">
                  {integrations.bookingConnected
                    ? "Sincronización activa con Booking.com"
                    : "Configure la conexión con Booking.com"}
                </p>
              </div>
              <Button
                variant="outline"
                className={cn(
                  "border-[#333333] bg-transparent",
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
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5]">Usuarios del Sistema</h3>
              <Button className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Usuario
              </Button>
            </div>

            <div className="space-y-3">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-[#333333] bg-[#0F0F0F]"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-[#333333]">
                      <AvatarFallback className="bg-[#252525] text-[#E5E5E5]">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-[#E5E5E5]">{member.name}</p>
                      <p className="text-sm text-[#A3A3A3]">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select defaultValue={member.role}>
                      <SelectTrigger className="w-[140px] bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                        <SelectItem value="admin" className="text-[#E5E5E5] focus:bg-[#252525]">
                          Administrador
                        </SelectItem>
                        <SelectItem value="operator" className="text-[#E5E5E5] focus:bg-[#252525]">
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
