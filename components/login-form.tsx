"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form" // Usamos hook-form para gestionar mejor los inputs
import { zodResolver } from "@hookform/resolvers/zod" // Necesario si usas zod (opcional, aquí lo haré simple con state)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function LoginForm() {
    const router = useRouter()

    // Estados del formulario
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    // Inputs controlados
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Función para limpiar errores al escribir
    const handleInputChange = (setter: (val: string) => void, value: string) => {
        setter(value)
        if (errorMessage) setErrorMessage("") // Oculta la alerta si el usuario intenta corregir
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage("") // Limpiar errores previos

        try {
            // Petición al endpoint real
            const response = await api.post("/auth/login", {
                username: email,
                password: password
            })

            const { token } = response.data

            // Guardar token en Cookies
            document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`

            toast.success("Bienvenido a Zafiro PMS")
            router.push("/dashboard")
            router.refresh()

        } catch (error: any) {
            console.error("Login error:", error)

            if (error.response && error.response.status === 401) {
                // 1. Mostrar Toast
                toast.error("Acceso Denegado")
                // 2. Mostrar Alerta en el formulario (Más visible)
                setErrorMessage("Usuario o contraseña incorrectos. Verifique sus credenciales.")
            } else {
                toast.error("Error del Servidor")
                setErrorMessage("No se pudo conectar con el servidor. Intente más tarde.")
            }
        } finally {
            setIsLoading(false)
        }
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

                {/* --- ALERTA DE ERROR --- */}
                {errorMessage && (
                    <div className={`mb-4 transition-all duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error de Autenticación</AlertTitle>
                            <AlertDescription>
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                {/* ----------------------- */}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div
                        className={`space-y-2 transition-all duration-500 delay-[400ms] ${
                            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                        }`}
                    >
                        <Label htmlFor="email" className="text-muted-foreground text-sm">
                            Usuario
                        </Label>
                        <Input
                            id="email"
                            type="text"
                            placeholder="admin"
                            value={email}
                            // Limpiamos el error cuando el usuario escribe
                            onChange={(e) => handleInputChange(setEmail, e.target.value)}
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
                            onChange={(e) => handleInputChange(setPassword, e.target.value)}
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

                <p
                    className={`text-center text-xs text-[#666666] mt-6 transition-all duration-500 delay-700 ${
                        mounted ? "opacity-100" : "opacity-0"
                    }`}
                >
                    ¿Problemas para acceder? Contacte al administrador
                </p>
            </div>

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