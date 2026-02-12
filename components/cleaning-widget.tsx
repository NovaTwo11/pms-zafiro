"use client"

import { CheckCircle2, AlertCircle, Wrench } from "lucide-react"
import type { RoomStatusCounts } from "@/types"

interface CleaningWidgetProps {
    counts: RoomStatusCounts
}

export function CleaningWidget({ counts }: CleaningWidgetProps) {
    // Asegurar valores por defecto
    const clean = counts?.clean || 0
    const dirty = counts?.dirty || 0
    const maintenance = counts?.maintenance || 0

    return (
        <div className="rounded-lg border border-border bg-card p-6 h-full flex flex-col">
            <div>
                <h3 className="font-serif text-lg font-semibold text-foreground">Limpieza</h3>
                <p className="text-sm text-muted-foreground">Estado de habitaciones</p>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-3 pt-6">
                {/* Limpias */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-[#059669]/20 bg-[#059669]/5 p-3 text-center transition-colors hover:bg-[#059669]/10">
                    <CheckCircle2 className="mb-2 h-6 w-6 text-[#059669]" />
                    <p className="text-2xl font-bold text-[#059669]">{clean}</p>
                    <p className="text-xs text-muted-foreground font-medium">Listas</p>
                </div>

                {/* Sucias */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5 p-3 text-center transition-colors hover:bg-[#F59E0B]/10">
                    <AlertCircle className="mb-2 h-6 w-6 text-[#F59E0B]" />
                    <p className="text-2xl font-bold text-[#F59E0B]">{dirty}</p>
                    <p className="text-xs text-muted-foreground font-medium">Sucias</p>
                </div>

                {/* Mantenimiento */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-[#CF6679]/20 bg-[#CF6679]/5 p-3 text-center transition-colors hover:bg-[#CF6679]/10">
                    <Wrench className="mb-2 h-6 w-6 text-[#CF6679]" />
                    <p className="text-2xl font-bold text-[#CF6679]">{maintenance}</p>
                    <p className="text-xs text-muted-foreground font-medium">Mant.</p>
                </div>
            </div>
        </div>
    )
}