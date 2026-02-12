"use client"

import { useState, useEffect, useMemo } from "react"
import { format, parseISO, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import {
  Download,
  FileText,
  Calculator,
  Scale,
  Globe,
  Printer,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  CheckCircle2,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { CashierShiftDto } from "@/types"
import { useCashierStore } from "@/lib/store" // <--- 1. IMPORTAR EL STORE

// --- DATOS MOCK PARA OTRAS PESTAÑAS (NO TOCADOS) ---
const foreignerGuests = [
  { id: "f1", name: "John Smith", nationality: "Estados Unidos", passport: "US123456789", entryDate: new Date(2026, 0, 3), checkIn: new Date(2026, 0, 5), checkOut: new Date(2026, 0, 8), room: "203" },
  { id: "f2", name: "Marie Dupont", nationality: "Francia", passport: "FR987654321", entryDate: new Date(2026, 0, 4), checkIn: new Date(2026, 0, 5), checkOut: new Date(2026, 0, 10), room: "305" },
]

const defaultContractTemplate = `CONTRATO DE HOSPEDAJE... (Texto largo omitido por brevedad)...`

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("auditoria")

  // --- 2. OBTENER lastUpdate DEL STORE ---
  // Esta variable cambia cada vez que haces refreshReport() desde cualquier lugar de la app
  const { lastUpdate } = useCashierStore()

  const [shifts, setShifts] = useState<CashierShiftDto[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))

  // --- ESTADO PARA OTRAS PESTAÑAS ---
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [newMovement, setNewMovement] = useState({ type: "ingreso", description: "", amount: "" })
  const [contractTemplate, setContractTemplate] = useState(defaultContractTemplate)
  const [isEditingContract, setIsEditingContract] = useState(false)

  // 3. AGREGAR lastUpdate A LAS DEPENDENCIAS DEL EFECTO
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true)
      try {
        // TRUCO: Añadimos ?t=timestamp para evitar el caché del navegador
        const res = await api.get<CashierShiftDto[]>(`/cashier/history?t=${Date.now()}`)
        setShifts(res.data || [])
      } catch (error) {
        console.error("Error al cargar historial de caja", error)
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchHistory()

  }, [lastUpdate])

  // 4. FILTRAR Y CALCULAR KPI (Sin cambios en lógica)
  const dailyData = useMemo(() => {
    const targetDate = parseISO(selectedDate)

    const dayShifts = shifts.filter(s => {
      // Ajuste: Aseguramos que parseISO maneje bien la fecha UTC que viene del back
      const openDate = parseISO(s.openedAt)
      // Nota: isSameDay usa la zona horaria local del navegador.
      // Si el servidor envía UTC y tú estás en Colombia, esto suele funcionar bien
      // siempre que la fecha de apertura sea "hoy" en tu hora local.
      return isSameDay(openDate, targetDate)
    })

    const saldoInicial = dayShifts.reduce((acc, s) => acc + s.startingAmount, 0)

    // Aquí es donde tu corrección del backend (MapToDto) brilla:
    // systemCalculatedAmount ya trae (Base + Pagos) actualizados en tiempo real.
    const saldoSistema = dayShifts.reduce((acc, s) => acc + s.systemCalculatedAmount, 0)

    const saldoReal = dayShifts.reduce((acc, s) => acc + s.actualAmount, 0)

    const ventas = saldoSistema - saldoInicial

    const closedShifts = dayShifts.filter(s => s.status === 1)

    // Diferencia solo aplica para turnos CERRADOS.
    // Para turnos ABIERTOS, asumimos diferencia 0 (o podrías mostrar 'En curso')
    const diferencia = closedShifts.reduce((acc, s) => acc + (s.actualAmount - s.systemCalculatedAmount), 0)

    return {
      shifts: dayShifts,
      saldoInicial,
      ventas,
      gastos: 0,
      saldoEsperado: saldoSistema,
      saldoReal: closedShifts.length > 0 ? saldoReal : saldoSistema,
      diferencia
    }
  }, [shifts, selectedDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatTime = (dateStr: string) => format(parseISO(dateStr), "HH:mm", { locale: es })

  // --- HANDLERS (MOCK) ---
  const handleExportTRA = () => alert("Reporte TRA generado y descargado exitosamente")
  const handleExportSIRE = () => alert("Reporte SIRE de extranjeros generado y descargado exitosamente")
  const generateContract = () => alert("Contrato generado exitosamente.")
  const handleAddMovement = () => { setMovementModalOpen(false); alert("Movimiento registrado (Mock)") }

  return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground">Reportes</h1>
          <p className="text-muted-foreground">Auditoría, cumplimiento legal y contratos</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card border border-border rounded-lg p-1 h-auto">
            <TabsTrigger value="auditoria" className="flex-1 py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-[#D4AF37] text-muted-foreground rounded-md transition-all duration-300">
              <Calculator className="h-4 w-4 mr-2" /> Auditoría de Caja
            </TabsTrigger>
            <TabsTrigger value="legal" className="flex-1 py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-[#D4AF37] text-muted-foreground rounded-md transition-all duration-300">
              <Scale className="h-4 w-4 mr-2" /> Cumplimiento Legal
            </TabsTrigger>
            <TabsTrigger value="contratos" className="flex-1 py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-[#D4AF37] text-muted-foreground rounded-md transition-all duration-300">
              <FileText className="h-4 w-4 mr-2" /> Contratos
            </TabsTrigger>
          </TabsList>

          {/* --- AUDITORÍA DE CAJA --- */}
          <TabsContent value="auditoria" className="mt-6 space-y-6">

            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Fecha del Reporte</Label>
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-[200px] bg-card border-border text-foreground focus:border-[#D4AF37]"
                />
              </div>
              <Button onClick={() => setMovementModalOpen(true)} className="mt-6 bg-[#059669] text-white hover:bg-[#059669]/90">
                <Plus className="h-4 w-4 mr-2" /> Registrar Gasto/Ingreso
              </Button>
              <Button variant="outline" className="mt-6 border-border text-foreground hover:bg-accent bg-transparent">
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Inicial</p>
                    <p className="text-xl font-semibold text-foreground">
                      {loadingHistory ? "..." : formatCurrency(dailyData.saldoInicial)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[#059669]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ventas (Abonos)</p>
                    <p className="text-xl font-semibold text-[#059669]">
                      {loadingHistory ? "..." : formatCurrency(dailyData.ventas)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#CF6679]/10 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-[#CF6679]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gastos</p>
                    <p className="text-xl font-semibold text-[#CF6679]">
                      {formatCurrency(dailyData.gastos)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Esperado</p>
                    <p className="text-xl font-semibold text-[#D4AF37]">
                      {loadingHistory ? "..." : formatCurrency(dailyData.saldoEsperado)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Listado de Turnos */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground mb-4">
                Desglose de Turnos ({dailyData.shifts.length})
              </h3>

              <div className="overflow-hidden rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Sistema (Calculado)</TableHead>
                      <TableHead>Real (Contado)</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyData.shifts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay turnos registrados en esta fecha.
                          </TableCell>
                        </TableRow>
                    ) : (
                        dailyData.shifts.map((shift) => {
                          const diff = shift.actualAmount - shift.systemCalculatedAmount;
                          const isClosed = shift.status === 1; // Asumiendo 1 = Closed

                          return (
                              <TableRow key={shift.id}>
                                <TableCell>
                                  {shift.status === 0 ? (
                                      <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Abierto</Badge>
                                  ) : (
                                      <Badge variant="secondary">Cerrado</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatTime(shift.openedAt)} - {shift.closedAt ? formatTime(shift.closedAt) : "..."}
                                </TableCell>
                                <TableCell>{formatCurrency(shift.startingAmount)}</TableCell>
                                <TableCell className="text-[#D4AF37] font-medium">{formatCurrency(shift.systemCalculatedAmount)}</TableCell>
                                <TableCell className="font-medium">
                                  {isClosed ? formatCurrency(shift.actualAmount) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isClosed ? (
                                      <span className={cn("font-bold", diff === 0 ? "text-green-600" : "text-red-500")}>
                                          {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                                      </span>
                                  ) : (
                                      <span className="text-muted-foreground text-xs">En curso</span>
                                  )}
                                </TableCell>
                              </TableRow>
                          )
                        })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Total Diferencia del Día */}
              <div className="mt-6 p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Balance de Arqueos (Solo Cerrados)</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Diferencia Total:</span>
                    <p className={cn(
                        "text-xl font-bold flex items-center gap-2",
                        dailyData.diferencia === 0 ? "text-[#059669]" : "text-[#CF6679]"
                    )}>
                      {dailyData.diferencia === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                      {formatCurrency(dailyData.diferencia)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* --- CUMPLIMIENTO LEGAL (Sin Cambios) --- */}
          <TabsContent value="legal" className="mt-6 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground">Reporte TRA (MinCIT)</h3>
                  <p className="text-sm text-muted-foreground mt-1">Tarjeta de Registro de Alojamiento</p>
                </div>
                <Button onClick={handleExportTRA} className="bg-primary text-[#0F0F0F] hover:bg-primary/90">
                  <Download className="h-4 w-4 mr-2" /> Generar Reporte TRA
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground flex items-center gap-2">
                    <Globe className="h-5 w-5 text-[#D4AF37]" /> Novedades Extranjeros (SIRE)
                  </h3>
                </div>
                <Button onClick={handleExportSIRE} className="bg-[#059669] text-white hover:bg-[#059669]/90">
                  <Download className="h-4 w-4 mr-2" /> Exportar SIRE
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nacionalidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Check-in</th>
                  </tr>
                  </thead>
                  <tbody>
                  {foreignerGuests.map((guest) => (
                      <tr key={guest.id} className="border-b border-border">
                        <td className="px-4 py-3 text-sm">{guest.name}</td>
                        <td className="px-4 py-3 text-sm">{guest.nationality}</td>
                        <td className="px-4 py-3 text-sm">{format(guest.checkIn, "dd MMM", { locale: es })}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* --- CONTRATOS (Sin Cambios) --- */}
          <TabsContent value="contratos" className="mt-6 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-foreground">Editor de Plantillas</h3>
                <Button variant="outline" onClick={() => setIsEditingContract(!isEditingContract)}>
                  <Edit className="h-4 w-4 mr-2" /> {isEditingContract ? "Guardar" : "Editar"}
                </Button>
              </div>
              {isEditingContract ? (
                  <Textarea value={contractTemplate} onChange={(e) => setContractTemplate(e.target.value)} className="min-h-[300px] font-mono text-sm" />
              ) : (
                  <div className="p-6 rounded-lg bg-card text-black min-h-[300px] whitespace-pre-wrap font-mono text-sm">{contractTemplate}</div>
              )}
              <div className="flex gap-3 mt-4">
                <Button onClick={generateContract} className="bg-primary text-[#0F0F0F]"><Printer className="h-4 w-4 mr-2" /> Imprimir</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Movimiento Manual */}
        <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Registrar Movimiento Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newMovement.type} onValueChange={(v) => setNewMovement({ ...newMovement, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="egreso">Egreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={newMovement.description} onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" value={newMovement.amount} onChange={(e) => setNewMovement({ ...newMovement, amount: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setMovementModalOpen(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleAddMovement} className="flex-1 bg-[#059669]">Registrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  )
}