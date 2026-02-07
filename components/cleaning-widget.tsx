"use client"

import { CheckCircle2, AlertCircle, Wrench } from "lucide-react"

const cleaningData = {
  clean: 15,
  dirty: 8,
  maintenance: 2,
}

const rooms = [
  { number: "102", status: "dirty", floor: 1 },
  { number: "105", status: "dirty", floor: 1 },
  { number: "201", status: "dirty", floor: 2 },
  { number: "204", status: "dirty", floor: 2 },
  { number: "303", status: "maintenance", floor: 3 },
]

export function CleaningWidget() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-serif text-lg font-semibold text-foreground">Estado de Limpieza</h3>
      <p className="text-sm text-muted-foreground">Resumen del housekeeping</p>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-lg bg-[#059669]/10 p-3">
          <CheckCircle2 className="h-5 w-5 text-[#059669]" />
          <div>
            <p className="text-2xl font-semibold text-[#059669]">{cleaningData.clean}</p>
            <p className="text-xs text-muted-foreground">Limpias</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-[#F59E0B]/10 p-3">
          <AlertCircle className="h-5 w-5 text-[#F59E0B]" />
          <div>
            <p className="text-2xl font-semibold text-[#F59E0B]">{cleaningData.dirty}</p>
            <p className="text-xs text-muted-foreground">Sucias</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-[#CF6679]/10 p-3">
          <Wrench className="h-5 w-5 text-[#CF6679]" />
          <div>
            <p className="text-2xl font-semibold text-[#CF6679]">{cleaningData.maintenance}</p>
            <p className="text-xs text-muted-foreground">Manten.</p>
          </div>
        </div>
      </div>

      {/* Pending Rooms */}
      <div className="mt-4">
        <p className="text-sm font-medium text-foreground mb-2">Pendientes de atención</p>
        <div className="flex flex-wrap gap-2">
          {rooms.map((room) => (
            <span
              key={room.number}
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
                room.status === "dirty" ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-[#CF6679]/10 text-[#CF6679]"
              }`}
            >
              {room.number}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
