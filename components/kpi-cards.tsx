"use client"

import { Users, CalendarCheck, TrendingUp, DollarSign } from "lucide-react"

const kpis = [
  {
    label: "Huéspedes en Casa",
    value: "24",
    change: "+3 hoy",
    icon: Users,
    color: "text-[#3B82F6]",
    bgColor: "bg-[#3B82F6]/10",
  },
  {
    label: "Llegadas Pendientes",
    value: "8",
    change: "Para hoy",
    icon: CalendarCheck,
    color: "text-[#D4AF37]",
    bgColor: "bg-primary/10",
  },
  {
    label: "Ocupación",
    value: "76%",
    change: "+5% vs ayer",
    icon: TrendingUp,
    color: "text-[#059669]",
    bgColor: "bg-[#059669]/10",
  },
  {
    label: "Ventas Bar (Turno)",
    value: "$485,000",
    change: "COP",
    icon: DollarSign,
    color: "text-[#D4AF37]",
    bgColor: "bg-primary/10",
  },
]

export function KPICards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.label}
            className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-[#444444]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{kpi.value}</p>
                <p className={`mt-1 text-xs ${kpi.color}`}>{kpi.change}</p>
              </div>
              <div className={`rounded-lg ${kpi.bgColor} p-2.5`}>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
