"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCashierStore } from "@/lib/store"
import { cashierApi} from "@/lib/api"
import { toast } from "sonner"
import { Banknote, LockKeyhole, Calculator, AlertCircle, RefreshCw } from "lucide-react"
import {CashierReportDto} from "@/types";

interface CashierManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CashierManagementModal({ isOpen, onClose }: CashierManagementModalProps) {
    const { isShiftOpen, checkStatus, setShift } = useCashierStore();
    const [loading, setLoading] = useState(false);

    // Estado para Apertura
    const [startAmount, setStartAmount] = useState("");

    // Estado para Cierre
    const [report, setReport] = useState<CashierReportDto | null>(null);
    const [actualAmount, setActualAmount] = useState("");
    const [step, setStep] = useState<"summary" | "count">("summary");

    // Resetear estados al abrir/cerrar modal
    useEffect(() => {
        if (isOpen) {
            if (isShiftOpen) fetchReport();
            else setStartAmount("");
        }
    }, [isOpen, isShiftOpen]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const data = await cashierApi.getReport();
            setReport(data);
            setStep("summary");
        } catch (error) {
            toast.error("Error al cargar el reporte de caja");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenShift = async () => {
        if (!startAmount) return;
        setLoading(true);
        try {
            const shift = await cashierApi.openShift(Number(startAmount));
            setShift(shift);
            toast.success("Caja abierta correctamente");
            onClose();
            // Opcional: Recargar también al abrir si quieres ver cambios inmediatos
            // window.location.reload();
        } catch (error) {
            toast.error("Error al abrir la caja");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseShift = async () => {
        if (!actualAmount) return;
        setLoading(true);
        try {
            const shift = await cashierApi.closeShift(Number(actualAmount));
            setShift(null); // Limpiamos el turno actual
            await checkStatus(); // Revalidamos
            toast.success(`Turno cerrado. Diferencia: ${shift.actualAmount - shift.systemCalculatedAmount}`);

            onClose();

            // --- CORRECCIÓN SOLICITADA: RECARGA AUTOMÁTICA ---
            // Esto asegura que los reportes y la UI se actualicen por completo
            window.location.reload();

        } catch (error) {
            toast.error("Error al cerrar la caja");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(val);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isShiftOpen ? <LockKeyhole className="h-5 w-5 text-red-500" /> : <Banknote className="h-5 w-5 text-green-600" />}
                        {isShiftOpen ? "Cierre de Caja" : "Apertura de Turno"}
                    </DialogTitle>
                </DialogHeader>

                {!isShiftOpen ? (
                    // --- VISTA APERTURA ---
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <p>Debe abrir una caja antes de realizar cualquier cobro en el sistema.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Base de Efectivo Inicial</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={startAmount}
                                onChange={(e) => setStartAmount(e.target.value)}
                                className="text-lg font-semibold"
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">Dinero físico en caja al iniciar el turno.</p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button onClick={handleOpenShift} disabled={loading || !startAmount}>
                                {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                Abrir Caja
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    // --- VISTA CIERRE ---
                    <div className="space-y-4 py-4">
                        {step === "summary" && report ? (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="p-3 bg-muted rounded-md">
                                        <span className="text-muted-foreground block">Efectivo Sistema</span>
                                        <span className="font-bold text-lg">{formatCurrency(report.totalCash)}</span>
                                    </div>
                                    <div className="p-3 bg-muted rounded-md">
                                        <span className="text-muted-foreground block">Tarjetas</span>
                                        <span className="font-bold text-lg">{formatCurrency(report.totalCards)}</span>
                                    </div>
                                    <div className="p-3 bg-muted rounded-md">
                                        <span className="text-muted-foreground block">Transferencias</span>
                                        <span className="font-bold text-lg">{formatCurrency(report.totalTransfers)}</span>
                                    </div>
                                    <div className="p-3 bg-muted rounded-md">
                                        <span className="text-muted-foreground block">Total Ingresos</span>
                                        <span className="font-bold text-lg text-green-600">{formatCurrency(report.totalIncome)}</span>
                                    </div>
                                </div>
                                <Button className="w-full" onClick={() => setStep("count")}>
                                    Proceder al Conteo
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right">
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300 flex gap-2">
                                    <Calculator className="h-5 w-5" />
                                    <p>Cuente el dinero físico en la caja e ingréselo abajo. El sistema calculará la diferencia.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Efectivo Real en Caja (Arqueo)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={actualAmount}
                                        onChange={(e) => setActualAmount(e.target.value)}
                                        className="text-2xl font-bold text-center h-14"
                                        autoFocus
                                    />
                                </div>
                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    <Button variant="ghost" onClick={() => setStep("summary")}>Volver</Button>
                                    <Button variant="destructive" onClick={handleCloseShift} disabled={loading || !actualAmount}>
                                        {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                        Cerrar Turno
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}