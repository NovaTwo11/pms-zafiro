"use client"

import { KPICards } from "./kpi-cards"
import { OccupancyChart } from "./occupancy-chart"
import { RevenueChart } from "./revenue-chart" // <--- Importar
import { DemographicsChart } from "./demographics-chart" // <--- Importar
import { ActivityFeed } from "./activity-feed"
import { CleaningWidget } from "./cleaning-widget"

export function DashboardContent() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Resumen operativo del día</p>
            </div>

            {/* KPI Cards */}
            <KPICards />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Columna Izquierda (Principal) */}
                <div className="lg:col-span-2 space-y-6">
                    <RevenueChart /> {/* Ahora tiene altura fija interna de 400px para verse bien */}

                    <div className="grid gap-6 md:grid-cols-2">
                        <OccupancyChart />
                        <CleaningWidget />
                    </div>
                </div>

                {/* Columna Derecha (Lateral) */}
                <div className="lg:col-span-1 space-y-6">
                    <DemographicsChart />
                    <ActivityFeed />
                </div>
            </div>
        </div>
    )
}