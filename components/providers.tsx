"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function Providers({ children, ...props }: ThemeProviderProps) {
    // useState asegura que el QueryClient se cree una sola vez por sesión de cliente
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Evita re-fetch agresivo mientras el usuario llena formularios
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider {...props}>
                {children}
            </NextThemesProvider>
            {/* Devtools: útil para depurar si los datos llegan o no. Se elimina en prod automáticamente */}
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        </QueryClientProvider>
    )
}