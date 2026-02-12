"use client"

import { Users, CalendarCheck, TrendingUp, DollarSign, LogOut } from "lucide-react"

interface KPICardsProps {
  checkIns: number
  checkOuts: number
  occupancy: number
  revenue: number
}

export function KPICards({ checkIns, checkOuts, occupancy, revenue }: KPICardsProps) {

  const formatCurrency = (val: number) =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
      }).format(val)

  const kpis = [
    {
      label: "Llegadas Hoy",
      value: checkIns.toString(),
      subtext: "Pendientes",
      icon: Users,
      color: "text-[#3B82F6]",
      bgColor: "bg-[#3B82F6]/10",
    },
    {
      label: "Salidas Hoy",
      value: checkOuts.toString(),
      subtext: "Por procesar",
      icon: LogOut,
      color: "text-[#CF6679]",
      bgColor: "bg-[#CF6679]/10",
    },
    {
      label: "Ocupación",
      value: `${occupancy}%`,
      subtext: "Tiempo real",
      icon: TrendingUp,
      color: "text-[#059669]",
      bgColor: "bg-[#059669]/10",
    },
    {
      label: "Ventas del Día",
      value: formatCurrency(revenue),
      subtext: "Facturado hoy",
      icon: DollarSign,
      color: "text-[#D4AF37]",
      bgColor: "bg-[#D4AF37]/10",
    },
  ]

  return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
              <div
                  key={kpi.label}
                  className="rounded-lg border border-border bg-card p-5 transition-all hover:border-[#444444]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{kpi.value}</p>
                    <p className={`mt-1 text-xs ${kpi.color} font-medium`}>{kpi.subtext}</p>
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