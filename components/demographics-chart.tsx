"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { DemographicData } from "@/types"

interface DemographicsChartProps {
    data: DemographicData[]
}

const COLORS = ["#D4AF37", "#333333", "#A3A3A3", "#555555", "#E5E5E5"]

export function DemographicsChart({ data }: DemographicsChartProps) {
    // Si no hay datos, mostrar estado vacío
    if (!data || data.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2 self-start">Demografía</h3>
                <p className="text-muted-foreground text-sm">Sin datos de huéspedes registrados</p>
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col h-[350px]">
            <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Demografía</h3>
            <p className="text-xs text-muted-foreground mb-4">Nacionalidad de huéspedes activos</p>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            strokeWidth={0}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1a1a1a",
                                borderColor: "#333",
                                borderRadius: "8px",
                                color: "#fff"
                            }}
                            itemStyle={{ color: "#fff" }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}