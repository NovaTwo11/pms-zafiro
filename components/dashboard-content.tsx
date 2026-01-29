"use client"

import { KPICards } from "./kpi-cards"
import { OccupancyChart } from "./occupancy-chart"
import { ActivityFeed } from "./activity-feed"
import { CleaningWidget } from "./cleaning-widget"

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[#E5E5E5]">Dashboard</h1>
        <p className="text-[#A3A3A3]">Resumen operativo del día</p>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <OccupancyChart />
          <CleaningWidget />
        </div>

        {/* Right Column - Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
