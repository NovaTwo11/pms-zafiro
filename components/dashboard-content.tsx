"use client"

import { useEffect, useState } from "react"
import { KPICards } from "@/components/kpi-cards"
import { OccupancyChart } from "@/components/occupancy-chart"
import { RevenueChart } from "@/components/revenue-chart"
import { DemographicsChart } from "@/components/demographics-chart"
import { ActivityFeed } from "@/components/activity-feed"
import { CleaningWidget } from "@/components/cleaning-widget"
import { dashboardApi } from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { DashboardStats, RevenueChartData, DemographicData, ActivityItem } from "@/types"

export function DashboardContent() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [revenueData, setRevenueData] = useState<RevenueChartData[]>([])
    const [demographics, setDemographics] = useState<DemographicData[]>([])
    const [activities, setActivities] = useState<ActivityItem[]>([])

    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true)
                // Ejecutamos todas las peticiones en paralelo para mayor velocidad
                const [statsData, revData, demoData, actData] = await Promise.all([
                    dashboardApi.getStats(),
                    dashboardApi.getRevenueHistory(),
                    dashboardApi.getDemographics(),
                    dashboardApi.getRecentActivity()
                ])

                setStats(statsData)
                setRevenueData(revData)
                setDemographics(demoData)
                setActivities(actData)
            } catch (error) {
                console.error("Dashboard load error:", error)
                toast.error("Error al cargar datos. Verifica que el backend esté corriendo.")
            } finally {
                setLoading(false)
            }
        }

        loadAllData()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Sincronizando Zafiro...</span>
            </div>
        )
    }

    const safeStats = stats || {
        occupancyRate: 0,
        totalRevenue: 0,
        checkInsPending: 0,
        checkOutsPending: 0,
        roomStatusCounts: { clean: 0, dirty: 0, maintenance: 0, occupied: 0 }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Visión general operativa en tiempo real</p>
            </div>

            <KPICards
                checkIns={safeStats.checkInsPending}
                checkOuts={safeStats.checkOutsPending}
                occupancy={safeStats.occupancyRate}
                revenue={safeStats.totalRevenue}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Pasamos los datos históricos reales */}
                    <RevenueChart data={revenueData} totalToday={safeStats.totalRevenue} />

                    <div className="grid gap-6 md:grid-cols-2">
                        <OccupancyChart percentage={safeStats.occupancyRate} />
                        <CleaningWidget counts={safeStats.roomStatusCounts} />
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <DemographicsChart data={demographics} />
                    <ActivityFeed activities={activities} />
                </div>
            </div>
        </div>
    )
}