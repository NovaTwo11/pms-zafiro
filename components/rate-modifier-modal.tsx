"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

interface RateModifierModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (roomId: string | "ALL", startDate: Date, endDate: Date, newPrice: number) => void
    roomCategories: string[]
}

export function RateModifierModal({ isOpen, onClose, onSave, roomCategories }: RateModifierModalProps) {
    const [scope, setScope] = useState<"ALL" | string>("ALL")
    const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [price, setPrice] = useState("")

    const handleSave = () => {
        if (!price || isNaN(Number(price))) return alert("Ingrese un precio válido")
        onSave(scope, new Date(startDate), new Date(endDate), Number(price))
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1A1A1A] border-[#333] text-[#E5E5E5]">
                <DialogHeader>
                    <DialogTitle>Gestión de Tarifas y Temporadas</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Desde</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-[#0F0F0F] border-[#333] text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hasta</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-[#0F0F0F] border-[#333] text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Aplicar a</Label>
                        <Select value={scope} onValueChange={setScope}>
                            <SelectTrigger className="bg-[#0F0F0F] border-[#333] text-white">
                                <SelectValue placeholder="Seleccionar alcance" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1A1A] border-[#333] text-[#E5E5E5]">
                                <SelectItem value="ALL">Todas las habitaciones</SelectItem>
                                {roomCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>Categoría: {cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Nuevo Precio por Noche</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-[#A3A3A3]">$</span>
                            <Input
                                type="number"
                                placeholder="Ej: 180000"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="pl-7 bg-[#0F0F0F] border-[#333] text-white"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="border-[#333] hover:bg-[#252525] text-white">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90">Aplicar Tarifa</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}