"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import type { RevenueChartData } from "@/types"

interface RevenueChartProps {
    data: RevenueChartData[]
    totalToday: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-[#D4AF37] bg-background p-3 shadow-xl">
                <p className="text-sm font-bold text-foreground mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground w-16 capitalize">{entry.name}:</span>
                            <span className="font-mono font-medium text-foreground">
                {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                }).format(entry.value)}
              </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return null
}

export function RevenueChart({ data, totalToday }: RevenueChartProps) {
    const formattedTotal = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(totalToday)

    return (
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col h-[400px]">
            <div className="mb-4 flex justify-between items-start">
                <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                        Ingresos Semanales
                    </h3>
                    <p className="text-xs text-muted-foreground">Comportamiento últimos 7 días</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-[#D4AF37]">Hoy: {formattedTotal}</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#A3A3A3"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#A3A3A3"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#252525', opacity: 0.4 }} />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: "12px", color: "#A3A3A3" }}
                        />
                        <Bar
                            dataKey="ingresos"
                            name="Ingresos"
                            fill="#D4AF37"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                        {/* Si en el futuro implementas gastos, descomenta esta línea */}
                        {/* <Bar dataKey="gastos" name="Gastos" fill="#CF6679" radius={[4, 4, 0, 0]} maxBarSize={50} /> */}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}