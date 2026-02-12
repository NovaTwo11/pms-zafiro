"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface OccupancyChartProps {
  percentage: number
}

export function OccupancyChart({ percentage }: OccupancyChartProps) {
  // Asegurar que percentage es un número válido entre 0 y 100
  const safePercentage = Math.min(Math.max(percentage || 0, 0), 100)

  const data = [
    { name: "Ocupadas", value: safePercentage, color: "#D4AF37" },
    { name: "Disponibles", value: 100 - safePercentage, color: "#333333" },
  ]

  return (
      <div className="rounded-lg border border-border bg-card p-6 h-full">
        <h3 className="font-serif text-lg font-semibold text-foreground">Estado Actual</h3>
        <p className="text-sm text-muted-foreground">Ocupación vs Disponibilidad</p>

        <div className="mt-6 flex items-center justify-center gap-8">
          <div className="relative h-[160px] w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                >
                  {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Indicador Central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[#D4AF37]">{safePercentage}%</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ocupado</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#D4AF37]" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Ocupadas</span>
                <span className="text-xs text-muted-foreground">{safePercentage}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#333333]" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Libres</span>
                <span className="text-xs text-muted-foreground">{100 - safePercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}