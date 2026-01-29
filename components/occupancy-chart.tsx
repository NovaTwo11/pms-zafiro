"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const data = [
  { name: "Ocupadas", value: 19, color: "#D4AF37" },
  { name: "Disponibles", value: 5, color: "#333333" },
  { name: "Mantenimiento", value: 1, color: "#CF6679" },
]

export function OccupancyChart() {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const occupied = data.find((d) => d.name === "Ocupadas")?.value || 0
  const percentage = Math.round((occupied / total) * 100)

  return (
    <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6">
      <h3 className="font-serif text-lg font-semibold text-[#E5E5E5]">Estado de Habitaciones</h3>
      <p className="text-sm text-[#A3A3A3]">Distribución actual</p>

      <div className="mt-4 flex items-center gap-8">
        <div className="relative h-[180px] w-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[#D4AF37]">{percentage}%</span>
            <span className="text-xs text-[#A3A3A3]">Ocupación</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-[#A3A3A3]">{item.name}</span>
              <span className="ml-auto text-sm font-medium text-[#E5E5E5]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
