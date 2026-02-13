"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

export type RateModifierPayload = {
    roomId?: string;
    category?: string;
    startDate: string;
    endDate: string;
    price: number;
}

interface RoomBasicInfo {
    id: string;
    number: string;
    category?: string;
}

interface RateModifierModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (payload: RateModifierPayload) => void
    rooms: RoomBasicInfo[]
}

export function RateModifierModal({ isOpen, onClose, onSave, rooms }: RateModifierModalProps) {
    const [applyTo, setApplyTo] = useState<"ALL" | "CATEGORY" | "ROOM">("ALL")
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [selectedRoom, setSelectedRoom] = useState<string>("")

    const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [price, setPrice] = useState("")

    // Extraer categorías únicas de la lista de habitaciones
    const roomCategories = Array.from(new Set(rooms.map(r => r.category || "General")));

    const handleSave = () => {
        if (!price || isNaN(Number(price))) return alert("Ingrese un precio válido")

        const payload: RateModifierPayload = {
            startDate,
            endDate,
            price: Number(price)
        };

        if (applyTo === "CATEGORY") {
            if (!selectedCategory) return alert("Seleccione una categoría")
            payload.category = selectedCategory;
        } else if (applyTo === "ROOM") {
            if (!selectedRoom) return alert("Seleccione una habitación")
            payload.roomId = selectedRoom;
        }

        onSave(payload)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* CAMBIO:
               - Quitamos 'bg-card' (ya lo trae por defecto el componente, pero lo dejamos explícito si prefieres).
               - Quitamos 'border-[#333]' -> Usamos 'border-border' o dejamos que el componente base lo maneje.
               - Quitamos 'text-foreground' redundante (se hereda), pero está bien dejarlo.
            */}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Gestión de Tarifas y Temporadas</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Desde</Label>
                            {/* CAMBIO:
                                - 'text-white' -> 'text-foreground' (Negro en claro, Blanco en oscuro)
                                - 'border-[#333]' -> 'border-input' (Gris suave en claro, oscuro en oscuro)
                                - 'bg-background' -> Correcto.
                            */}
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-background border-input text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hasta</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-background border-input text-foreground"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Aplicar a</Label>
                        <Select value={applyTo} onValueChange={(val: any) => setApplyTo(val)}>
                            {/* CAMBIO EN TRIGGER:
                               - 'text-white' -> 'text-foreground'
                               - 'border-[#333]' -> 'border-input'
                            */}
                            <SelectTrigger className="bg-background border-input text-foreground">
                                <SelectValue placeholder="Seleccionar alcance" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* El contenido del Select usa bg-popover por defecto en shadcn */}
                                <SelectItem value="ALL">Todas las habitaciones</SelectItem>
                                <SelectItem value="CATEGORY">Por Categoría</SelectItem>
                                <SelectItem value="ROOM">Habitación Específica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* SELECTOR CONDICIONAL: CATEGORÍAS */}
                    {applyTo === "CATEGORY" && (
                        <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                            <Label>Seleccionar Categoría</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="Elija una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomCategories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* SELECTOR CONDICIONAL: HABITACIÓN ESPECÍFICA */}
                    {applyTo === "ROOM" && (
                        <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                            <Label>Seleccionar Habitación</Label>
                            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="Elija una habitación" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms.map((room) => (
                                        <SelectItem key={room.id} value={room.id}>
                                            Habitación {room.number} ({room.category})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Nuevo Precio por Noche</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input
                                type="number"
                                placeholder="Ej: 180000"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="pl-7 bg-background border-input text-foreground"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    {/* CAMBIO BOTONES:
                        - Cancelar: Quitamos 'text-white' (ahora es automático) y 'border-[#333]'.
                        - Guardar: 'text-black' -> 'text-primary-foreground' (Se adapta mejor al contraste).
                    */}
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Aplicar Tarifa</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}