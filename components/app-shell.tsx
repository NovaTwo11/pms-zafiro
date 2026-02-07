"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { useSidebarStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function AppShell({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebarStore()

    return (
        <div className="relative min-h-screen bg-background">
            {/* Sidebar Fija (z-50) */}
            <Sidebar />

            {/* Contenedor Principal */}
            <div
                className={cn(
                    "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                    isCollapsed ? "pl-[80px]" : "pl-[280px]" // Empuja el contenido a la derecha según el sidebar
                )}
            >
                {/* Topbar Fija (z-40) */}
                {/* Nota: Su posición 'left' se controla dentro del componente Topbar para coincidir con el sidebar */}
                <Topbar />

                {/* Área de Contenido Scrollable */}
                {/* pt-16: Compensamos la altura fija del Topbar para evitar solapamiento */}
                <main className="flex-1 p-6 pt-20 overflow-y-auto">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}