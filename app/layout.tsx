import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Outfit, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
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
    <html lang="es">
      <body
        className={`${inter.variable} ${outfit.variable} ${plusJakarta.variable} ${geistMono.variable} font-sans antialiased bg-[#0F0F0F]`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
