"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login
    await new Promise((resolve) => setTimeout(resolve, 1000))

    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-md relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-aurora"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full animate-aurora"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 60%)",
            filter: "blur(40px)",
            animationDelay: "-4s",
          }}
        />
      </div>

      <div
        className={`rounded-xl border border-[#D4AF37]/30 bg-card/95 backdrop-blur-sm p-8 shadow-2xl transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}
      >
        {/* Logo - Updated to use Outfit font */}
        <div className="text-center mb-8">
          <div
            className={`mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center mb-4 transition-all duration-500 delay-100 ${
              mounted ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
          >
            <span className="font-[family-name:var(--font-logo)] text-2xl font-extrabold text-[#0F0F0F]">Z</span>
          </div>
          <h1
            className={`font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground transition-all duration-500 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            Hotel Zafiro
          </h1>
          <p
            className={`text-sm text-muted-foreground mt-1 transition-all duration-500 delay-300 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            Sistema de Gestión Hotelera
          </p>
        </div>

        {/* Form with staggered animation */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            className={`space-y-2 transition-all duration-500 delay-[400ms] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <Label htmlFor="email" className="text-muted-foreground text-sm">
              Usuario o Email
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="recepcion@hotelzafiro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 transition-all duration-300"
            />
          </div>

          <div
            className={`space-y-2 transition-all duration-500 delay-[500ms] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <Label htmlFor="password" className="text-muted-foreground text-sm">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 transition-all duration-300"
            />
          </div>

          <div
            className={`transition-all duration-500 delay-[600ms] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-[#0F0F0F] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <p
          className={`text-center text-xs text-[#666666] mt-6 transition-all duration-500 delay-700 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          ¿Problemas para acceder? Contacte al administrador
        </p>
      </div>

      {/* Subtle branding */}
      <p
        className={`text-center text-xs text-[#333333] mt-8 transition-all duration-500 delay-[800ms] ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        © 2026 Hotel Zafiro. Todos los derechos reservados.
      </p>
    </div>
  )
}
