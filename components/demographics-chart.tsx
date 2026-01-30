"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const data = [
    { name: "Nacionales", value: 65, color: "#D4AF37" },
    { name: "Extranjeros", value: 35, color: "#333333" },
]

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="rounded-lg border border-[#333333] bg-[#0F0F0F] p-2 shadow-xl">
                <div className="flex items-center gap-2 text-xs">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: data.color }}
                    />
                    <span className="text-[#A3A3A3]">{data.name}:</span>
                    <span className="font-bold text-[#E5E5E5]">{data.value}%</span>
                </div>
            </div>
        )
    }
    return null
}

export function DemographicsChart() {
    return (
        <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-6 h-[300px] flex flex-col">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#E5E5E5] mb-2">
                Procedencia
            </h3>

            <div className="flex-1 w-full relative min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: "12px", color: "#A3A3A3" }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Texto central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-bold text-[#E5E5E5]">{data[0].value}%</span>
                    <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider">Nacionales</span>
                </div>
            </div>
        </div>
    )
}