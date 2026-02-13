"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

// Configuración básica del cliente de Query
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // Los datos se consideran frescos por 1 minuto
            },
        },
    })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: siempre crea un nuevo cliente
        return makeQueryClient()
    } else {
        // Browser: reutiliza el cliente existente si ya tenemos uno
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
}

export function Providers({ children, ...props }: ThemeProviderProps) {
    const queryClient = getQueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider {...props}>
                {children}
            </NextThemesProvider>
        </QueryClientProvider>
    )
}