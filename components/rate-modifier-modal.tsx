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
            <DialogContent className="bg-card border-[#333] text-foreground">
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
                                className="bg-background border-[#333] text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hasta</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-background border-[#333] text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Aplicar a</Label>
                        <Select value={scope} onValueChange={setScope}>
                            <SelectTrigger className="bg-background border-[#333] text-white">
                                <SelectValue placeholder="Seleccionar alcance" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-[#333] text-foreground">
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
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input
                                type="number"
                                placeholder="Ej: 180000"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="pl-7 bg-background border-[#333] text-white"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="border-[#333] hover:bg-accent text-white">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-primary text-black hover:bg-primary/90">Aplicar Tarifa</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}