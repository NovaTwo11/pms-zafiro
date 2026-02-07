import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
})

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
})

export const metadata: Metadata = {
    title: "Hotel Zafiro - PMS",
    description: "Sistema de Gestión Hotelera de Lujo",
    generator: "v0.app",
}

export const viewport: Viewport = {
    themeColor: "#0F0F0F",
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
        <body
            className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground`}
        >
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Analytics />
        </ThemeProvider>
        </body>
        </html>
    )
}