"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

const data = [
    { name: "Lun", ingresos: 450000, gastos: 120000 },
    { name: "Mar", ingresos: 320000, gastos: 80000 },
    { name: "Mié", ingresos: 550000, gastos: 150000 },
    { name: "Jue", ingresos: 480000, gastos: 90000 },
    { name: "Vie", ingresos: 890000, gastos: 200000 },
    { name: "Sáb", ingresos: 1250000, gastos: 350000 },
    { name: "Dom", ingresos: 980000, gastos: 280000 },
]

// Componente personalizado para el Tooltip (la cajita flotante)
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-[#D4AF37] bg-[#0F0F0F] p-3 shadow-xl">
                <p className="text-sm font-bold text-[#E5E5E5] mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-[#A3A3A3] w-16">{entry.name}:</span>
                            <span className="font-mono font-medium text-[#E5E5E5]">
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

export function RevenueChart() {
    return (
        <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6 flex flex-col h-[400px]">
            <div className="mb-4">
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#E5E5E5]">
                    Balance Semanal
                </h3>
                <p className="text-xs text-[#A3A3A3]">Comparativa de flujos de caja</p>
            </div>

            {/* Contenedor responsivo que ocupa el resto de la altura */}
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
                        <Bar
                            dataKey="gastos"
                            name="Gastos"
                            fill="#CF6679"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}