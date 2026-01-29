"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Download,
  FileText,
  Calculator,
  Scale,
  Globe,
  Printer,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Edit,
  ShieldOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Sample audit data
const auditData = {
  saldoInicial: 500000,
  ventas: 1250000,
  abonos: 890000,
  gastos: 150000,
  saldoEsperado: 2490000,
  saldoReal: 2485000,
  diferencia: -5000,
}

const manualMovements = [
  { id: "m1", type: "egreso", description: "Compra Hielo", amount: 25000, date: new Date() },
  { id: "m2", type: "ingreso", description: "Base Caja", amount: 100000, date: new Date() },
]

// Sample foreigner guests for SIRE
const foreignerGuests = [
  {
    id: "f1",
    name: "John Smith",
    nationality: "Estados Unidos",
    passport: "US123456789",
    entryDate: new Date(2026, 0, 3),
    checkIn: new Date(2026, 0, 5),
    checkOut: new Date(2026, 0, 8),
    room: "203",
  },
  {
    id: "f2",
    name: "Marie Dupont",
    nationality: "Francia",
    passport: "FR987654321",
    entryDate: new Date(2026, 0, 4),
    checkIn: new Date(2026, 0, 5),
    checkOut: new Date(2026, 0, 10),
    room: "305",
  },
  {
    id: "f3",
    name: "Hans Mueller",
    nationality: "Alemania",
    passport: "DE456789123",
    entryDate: new Date(2026, 0, 2),
    checkIn: new Date(2026, 0, 5),
    checkOut: new Date(2026, 0, 7),
    room: "101",
  },
]

// Sample contract template
const defaultContractTemplate = `CONTRATO DE HOSPEDAJE

Entre HOTEL ZAFIRO, representado legalmente por su administrador, y el huésped {{nombre_huesped}}, identificado con documento {{documento}}, se celebra el presente contrato de hospedaje bajo los siguientes términos:

PRIMERO: El hotel se compromete a prestar servicios de alojamiento en la habitación {{habitacion}} desde el {{fecha_checkin}} hasta el {{fecha_checkout}}.

SEGUNDO: El huésped se compromete a cumplir con el reglamento interno del establecimiento.

TERCERO: El valor total del hospedaje es de {{valor_total}} COP.

Firmado en Bogotá, a los {{fecha_actual}}.

_________________________
Firma del Huésped`

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("auditoria")
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [selectedContract, setSelectedContract] = useState<string | null>(null)
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [newMovement, setNewMovement] = useState({ type: "ingreso", description: "", amount: "" })
  const [contractTemplate, setContractTemplate] = useState(defaultContractTemplate)
  const [isEditingContract, setIsEditingContract] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleExportTRA = () => {
    console.log("Exporting TRA report...")
    alert("Reporte TRA generado y descargado exitosamente")
  }

  const handleExportSIRE = () => {
    console.log("Exporting SIRE report...")
    alert("Reporte SIRE de extranjeros generado y descargado exitosamente")
  }

  const handleAnonymize = () => {
    if (confirm("¿Está seguro de anonimizar los datos según la Ley 1581? Esta acción no se puede deshacer.")) {
      alert("Datos anonimizados exitosamente según la Ley 1581 de Protección de Datos Personales")
    }
  }

  const generateContract = () => {
    const filledContract = contractTemplate
      .replace("{{nombre_huesped}}", "Juan García Mendoza")
      .replace("{{documento}}", "CC 123456789")
      .replace("{{habitacion}}", "201")
      .replace("{{fecha_checkin}}", "05 de Enero de 2026")
      .replace("{{fecha_checkout}}", "08 de Enero de 2026")
      .replace("{{valor_total}}", "540,000")
      .replace("{{fecha_actual}}", format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }))

    console.log("Generated contract:", filledContract)
    alert("Contrato generado exitosamente. Listo para imprimir.")
  }

  const handleAddMovement = () => {
    console.log("Adding movement:", newMovement)
    setMovementModalOpen(false)
    setNewMovement({ type: "ingreso", description: "", amount: "" })
    alert("Movimiento registrado exitosamente")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[#E5E5E5]">Reportes</h1>
        <p className="text-[#A3A3A3]">Auditoría, cumplimiento legal y contratos</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg p-1 h-auto">
          <TabsTrigger
            value="auditoria"
            className="flex-1 py-3 text-sm data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#A3A3A3] rounded-md transition-all duration-300"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Auditoría de Caja
          </TabsTrigger>
          <TabsTrigger
            value="legal"
            className="flex-1 py-3 text-sm data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#A3A3A3] rounded-md transition-all duration-300"
          >
            <Scale className="h-4 w-4 mr-2" />
            Cumplimiento Legal
          </TabsTrigger>
          <TabsTrigger
            value="contratos"
            className="flex-1 py-3 text-sm data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#A3A3A3] rounded-md transition-all duration-300"
          >
            <FileText className="h-4 w-4 mr-2" />
            Contratos
          </TabsTrigger>
        </TabsList>

        {/* Auditoría de Caja Tab */}
        <TabsContent value="auditoria" className="mt-6 space-y-6">
          {/* Date Selector and Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Fecha del Turno</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[200px] bg-[#1A1A1A] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300"
              />
            </div>
            <Button
              onClick={() => setMovementModalOpen(true)}
              className="mt-6 bg-[#059669] text-white hover:bg-[#059669]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Movimiento Manual
            </Button>
            <Button
              variant="outline"
              className="mt-6 border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent transition-all duration-300"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Reporte
            </Button>
          </div>

          {/* Audit Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-xs text-[#A3A3A3]">Saldo Inicial</p>
                  <p className="text-xl font-semibold text-[#E5E5E5]">{formatCurrency(auditData.saldoInicial)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[#059669]" />
                </div>
                <div>
                  <p className="text-xs text-[#A3A3A3]">Ventas + Abonos</p>
                  <p className="text-xl font-semibold text-[#059669]">
                    {formatCurrency(auditData.ventas + auditData.abonos)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#CF6679]/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-[#CF6679]" />
                </div>
                <div>
                  <p className="text-xs text-[#A3A3A3]">Gastos</p>
                  <p className="text-xl font-semibold text-[#CF6679]">{formatCurrency(auditData.gastos)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs text-[#A3A3A3]">Saldo Esperado</p>
                  <p className="text-xl font-semibold text-[#D4AF37]">{formatCurrency(auditData.saldoEsperado)}</p>
                </div>
              </div>
            </div>
          </div>

          {manualMovements.length > 0 && (
            <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5] mb-4">
                Movimientos Manuales del Día
              </h3>
              <div className="space-y-2">
                {manualMovements.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#0F0F0F] border border-[#333333]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          mov.type === "ingreso" ? "bg-[#059669]/10" : "bg-[#CF6679]/10",
                        )}
                      >
                        {mov.type === "ingreso" ? (
                          <TrendingUp className="h-4 w-4 text-[#059669]" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-[#CF6679]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-[#E5E5E5]">{mov.description}</p>
                        <p className="text-xs text-[#A3A3A3]">{format(mov.date, "HH:mm", { locale: es })}</p>
                      </div>
                    </div>
                    <p className={cn("font-medium", mov.type === "ingreso" ? "text-[#059669]" : "text-[#CF6679]")}>
                      {mov.type === "ingreso" ? "+" : "-"}
                      {formatCurrency(mov.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Calculation */}
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5] mb-4">Cálculo de Caja</h3>

            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between py-2 border-b border-[#333333]">
                <span className="text-[#A3A3A3]">Saldo Inicial</span>
                <span className="text-[#E5E5E5]">{formatCurrency(auditData.saldoInicial)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#333333]">
                <span className="text-[#059669]">+ Ventas POS</span>
                <span className="text-[#059669]">{formatCurrency(auditData.ventas)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#333333]">
                <span className="text-[#059669]">+ Abonos Folios</span>
                <span className="text-[#059669]">{formatCurrency(auditData.abonos)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#333333]">
                <span className="text-[#CF6679]">- Gastos</span>
                <span className="text-[#CF6679]">-{formatCurrency(auditData.gastos)}</span>
              </div>
              <div className="flex justify-between py-3 bg-[#0F0F0F] rounded px-3 mt-4">
                <span className="text-[#D4AF37] font-semibold">= Saldo Esperado</span>
                <span className="text-[#D4AF37] font-semibold">{formatCurrency(auditData.saldoEsperado)}</span>
              </div>
            </div>

            {/* Real vs Expected */}
            <div className="mt-6 p-4 rounded-lg border border-[#333333] bg-[#0F0F0F]">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-[#A3A3A3]">Saldo Esperado</p>
                  <p className="text-lg font-semibold text-[#D4AF37]">{formatCurrency(auditData.saldoEsperado)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A3A3A3]">Saldo Real</p>
                  <p className="text-lg font-semibold text-[#E5E5E5]">{formatCurrency(auditData.saldoReal)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A3A3A3]">Diferencia</p>
                  <p
                    className={cn(
                      "text-lg font-semibold",
                      auditData.diferencia === 0
                        ? "text-[#059669]"
                        : auditData.diferencia > 0
                          ? "text-[#059669]"
                          : "text-[#CF6679]",
                    )}
                  >
                    {auditData.diferencia === 0 ? (
                      <Minus className="h-5 w-5 mx-auto" />
                    ) : (
                      formatCurrency(auditData.diferencia)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Cumplimiento Legal Tab */}
        <TabsContent value="legal" className="mt-6 space-y-6">
          {/* TRA Section */}
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5]">Reporte TRA (MinCIT)</h3>
                <p className="text-sm text-[#A3A3A3] mt-1">
                  Tarjeta de Registro de Alojamiento - Ministerio de Comercio, Industria y Turismo
                </p>
              </div>
              <Button
                onClick={handleExportTRA}
                className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Generar Reporte TRA
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-[#0F0F0F] border border-[#333333]">
              <p className="text-sm text-[#A3A3A3]">
                El reporte TRA incluye información de todos los huéspedes registrados en el período seleccionado,
                cumpliendo con la normativa del MinCIT para establecimientos de alojamiento turístico.
              </p>
            </div>
          </div>

          {/* SIRE Section */}
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5] flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#D4AF37]" />
                  Novedades Extranjeros (SIRE)
                </h3>
                <p className="text-sm text-[#A3A3A3] mt-1">
                  Sistema de Información para el Registro de Extranjeros - Migración Colombia
                </p>
              </div>
              <Button
                onClick={handleExportSIRE}
                className="bg-[#059669] text-white hover:bg-[#059669]/90 transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar SIRE
              </Button>
            </div>

            {/* Foreigner Guests Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#333333]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase">Nacionalidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase">Pasaporte</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase">Check-in</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase">Habitación</th>
                  </tr>
                </thead>
                <tbody>
                  {foreignerGuests.map((guest) => (
                    <tr
                      key={guest.id}
                      className="border-b border-[#333333] last:border-0 hover:bg-[#252525] transition-all duration-300"
                    >
                      <td className="px-4 py-3 text-sm text-[#E5E5E5]">{guest.name}</td>
                      <td className="px-4 py-3 text-sm text-[#A3A3A3]">{guest.nationality}</td>
                      <td className="px-4 py-3 text-sm text-[#A3A3A3] font-mono">{guest.passport}</td>
                      <td className="px-4 py-3 text-sm text-[#A3A3A3]">
                        {format(guest.checkIn, "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#D4AF37] font-semibold">{guest.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/30">
              <p className="text-xs text-[#D4AF37]">
                Total de extranjeros del día: <strong>{foreignerGuests.length}</strong> huéspedes
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5]">
                  Protección de Datos (Ley 1581)
                </h3>
                <p className="text-sm text-[#A3A3A3] mt-1">
                  Anonimización de datos personales según la normativa colombiana
                </p>
              </div>
              <Button
                onClick={handleAnonymize}
                variant="outline"
                className="border-[#CF6679] text-[#CF6679] hover:bg-[#CF6679]/10 bg-transparent"
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                Anonimizar Datos
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Contratos Tab */}
        <TabsContent value="contratos" className="mt-6 space-y-6">
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#E5E5E5]">Editor de Plantillas</h3>
              <Button
                variant="outline"
                onClick={() => setIsEditingContract(!isEditingContract)}
                className="border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent"
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditingContract ? "Guardar" : "Editar Plantilla"}
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-[#0F0F0F] border border-[#333333] mb-4">
              <p className="text-xs text-[#A3A3A3]">
                Variables disponibles: <code className="text-[#D4AF37]">{"{{nombre_huesped}}"}</code>,
                <code className="text-[#D4AF37]"> {"{{documento}}"}</code>,
                <code className="text-[#D4AF37]"> {"{{habitacion}}"}</code>,
                <code className="text-[#D4AF37]"> {"{{fecha_checkin}}"}</code>,
                <code className="text-[#D4AF37]"> {"{{fecha_checkout}}"}</code>,
                <code className="text-[#D4AF37]"> {"{{valor_total}}"}</code>,
                <code className="text-[#D4AF37]"> {"{{fecha_actual}}"}</code>
              </p>
            </div>

            {isEditingContract ? (
              <Textarea
                value={contractTemplate}
                onChange={(e) => setContractTemplate(e.target.value)}
                className="min-h-[300px] bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] font-mono text-sm"
              />
            ) : (
              <div className="p-6 rounded-lg bg-white text-black min-h-[300px] whitespace-pre-wrap font-mono text-sm">
                {contractTemplate}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={generateContract} className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90">
                <Printer className="h-4 w-4 mr-2" />
                Generar e Imprimir
              </Button>
              <Button variant="outline" className="border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa con Datos
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1A1A1A] border-[#333333]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5]">
              Registrar Movimiento Manual
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Tipo de Movimiento</Label>
              <Select value={newMovement.type} onValueChange={(v) => setNewMovement({ ...newMovement, type: v })}>
                <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                  <SelectItem value="ingreso" className="text-[#E5E5E5] focus:bg-[#252525]">
                    Ingreso
                  </SelectItem>
                  <SelectItem value="egreso" className="text-[#E5E5E5] focus:bg-[#252525]">
                    Egreso
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Descripción</Label>
              <Input
                placeholder="Ej: Compra Hielo, Base Caja..."
                value={newMovement.description}
                onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })}
                className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Monto</Label>
              <Input
                type="number"
                placeholder="0"
                value={newMovement.amount}
                onChange={(e) => setNewMovement({ ...newMovement, amount: e.target.value })}
                className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setMovementModalOpen(false)}
                className="flex-1 border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddMovement}
                disabled={!newMovement.description || !newMovement.amount}
                className={cn(
                  "flex-1",
                  newMovement.type === "ingreso"
                    ? "bg-[#059669] hover:bg-[#059669]/90 text-white"
                    : "bg-[#CF6679] hover:bg-[#CF6679]/90 text-white",
                )}
              >
                Registrar {newMovement.type === "ingreso" ? "Ingreso" : "Egreso"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
