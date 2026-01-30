"use client"

import { useState } from "react"
import { CheckCircle, Plus, User, ArrowRight, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

// Importamos el tipo Guest (simulado aquí para contexto)
type GuestForm = {
    // Identificación
    primerNombre: string;
    segundoNombre: string;
    primerApellido: string;
    segundoApellido: string;
    tipoId: string;
    numeroId: string;
    fechaCumpleanos: string;
    genero: string;
    nacionalidad: string;

    // Contacto
    telefono: string;
    correo: string;
    ocupacion: string;

    // Ubicación
    paisResidencia: string;
    ciudadResidencia: string;
    paisOrigen: string;
    ciudadOrigen: string;
    paisDestino: string;
    ciudadDestino: string;
};

const initialGuestState: GuestForm = {
    primerNombre: "Carlos", // Pre-llenado (simulación)
    segundoNombre: "",
    primerApellido: "García", // Pre-llenado
    segundoApellido: "",
    tipoId: "CC",
    numeroId: "123456789",
    fechaCumpleanos: "",
    genero: "M",
    nacionalidad: "Colombiano",
    telefono: "+57 300 123 4567",
    correo: "carlos.garcia@email.com",
    ocupacion: "",
    paisResidencia: "",
    ciudadResidencia: "",
    paisOrigen: "",
    ciudadOrigen: "",
    paisDestino: "Colombia",
    ciudadDestino: "Zarzal" // Asumimos destino actual
}

interface GuestCheckInContentProps {
    reservationCode: string
}

export function GuestCheckInContent({ reservationCode }: GuestCheckInContentProps) {
    const [step, setStep] = useState(1) // 1: Titular, 2: Acompañantes, 3: Finalizado
    const [formData, setFormData] = useState<GuestForm>(initialGuestState)

    const handleChange = (field: keyof GuestForm, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmitTitular = (e: React.FormEvent) => {
        e.preventDefault()
        // Validaciones aquí si es necesario
        console.log("Datos titular guardados:", formData)
        setStep(2)
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-[#E5E5E5] flex flex-col items-center py-10 px-4">

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#D4AF37] mb-2 font-[family-name:var(--font-heading)]">Hotel Zafiro</h1>
                <p className="text-[#A3A3A3]">Registro de Huéspedes</p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-[#333333] text-xs font-mono text-[#E5E5E5]">
                    Reserva: {reservationCode}
                </div>
            </div>

            <div className="w-full max-w-3xl space-y-6">

                {/* --- PASO 1: FORMULARIO TITULAR --- */}
                {step === 1 && (
                    <Card className="bg-[#1A1A1A] border-[#333333]">
                        <CardHeader>
                            <CardTitle className="text-[#E5E5E5]">1. Datos del Titular</CardTitle>
                            <CardDescription>
                                Por favor complete todos los campos obligatorios (*) para agilizar su ingreso.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmitTitular}>
                            <CardContent className="space-y-6">

                                {/* SECCIÓN: IDENTIFICACIÓN */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 border-b border-[#333333] pb-1">Identificación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Primer Nombre *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.primerNombre} onChange={e => handleChange("primerNombre", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Segundo Nombre</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" value={formData.segundoNombre} onChange={e => handleChange("segundoNombre", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Primer Apellido *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.primerApellido} onChange={e => handleChange("primerApellido", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Segundo Apellido</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" value={formData.segundoApellido} onChange={e => handleChange("segundoApellido", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Tipo Documento *</Label>
                                            <Select value={formData.tipoId} onValueChange={v => handleChange("tipoId", v)}>
                                                <SelectTrigger className="bg-[#0F0F0F] border-[#333333]"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-[#1A1A1A] border-[#333333] text-white">
                                                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                                    <SelectItem value="PA">Pasaporte</SelectItem>
                                                    <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Número Documento *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.numeroId} onChange={e => handleChange("numeroId", e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[#A3A3A3]">Fecha Nacimiento *</Label>
                                                <Input type="date" className="bg-[#0F0F0F] border-[#333333]" required value={formData.fechaCumpleanos} onChange={e => handleChange("fechaCumpleanos", e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[#A3A3A3]">Género *</Label>
                                                <Select value={formData.genero} onValueChange={v => handleChange("genero", v)}>
                                                    <SelectTrigger className="bg-[#0F0F0F] border-[#333333]"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#1A1A1A] border-[#333333] text-white">
                                                        <SelectItem value="M">Masculino</SelectItem>
                                                        <SelectItem value="F">Femenino</SelectItem>
                                                        <SelectItem value="O">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Nacionalidad *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.nacionalidad} onChange={e => handleChange("nacionalidad", e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN: CONTACTO Y PROFESIÓN */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 border-b border-[#333333] pb-1">Contacto y Perfil</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Correo Electrónico *</Label>
                                            <Input type="email" className="bg-[#0F0F0F] border-[#333333]" required value={formData.correo} onChange={e => handleChange("correo", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Teléfono / Celular *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.telefono} onChange={e => handleChange("telefono", e.target.value)} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-[#A3A3A3]">Ocupación / Profesión *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required placeholder="Ej. Ingeniero, Estudiante, Comerciante..." value={formData.ocupacion} onChange={e => handleChange("ocupacion", e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN: UBICACIÓN (Ley de turismo) */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 border-b border-[#333333] pb-1">Ubicación y Procedencia</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">País de Residencia *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.paisResidencia} onChange={e => handleChange("paisResidencia", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Ciudad de Residencia *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.ciudadResidencia} onChange={e => handleChange("ciudadResidencia", e.target.value)} />
                                        </div>

                                        <Separator className="md:col-span-2 bg-[#333333]" />

                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">País de Procedencia (Origen) *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.paisOrigen} onChange={e => handleChange("paisOrigen", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Ciudad de Procedencia (Origen) *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.ciudadOrigen} onChange={e => handleChange("ciudadOrigen", e.target.value)} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">País de Destino (Siguiente) *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.paisDestino} onChange={e => handleChange("paisDestino", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#A3A3A3]">Ciudad de Destino (Siguiente) *</Label>
                                            <Input className="bg-[#0F0F0F] border-[#333333]" required value={formData.ciudadDestino} onChange={e => handleChange("ciudadDestino", e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 font-bold h-12">
                                    Guardar y Continuar <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* --- PASO 2: ACOMPAÑANTES --- */}
                {step === 2 && (
                    <Card className="bg-[#1A1A1A] border-[#333333]">
                        <CardHeader>
                            <CardTitle className="text-[#E5E5E5]">2. Acompañantes</CardTitle>
                            <CardDescription>
                                Si viaja solo, puede omitir este paso. Si viaja acompañado, registre los datos de las demás personas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-10 border-2 border-dashed border-[#333333] rounded-lg bg-[#0F0F0F]">
                                <User className="h-10 w-10 text-[#333333] mx-auto mb-3" />
                                <p className="text-[#A3A3A3] mb-4">No hay acompañantes registrados aún.</p>
                                <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Acompañante
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="ghost" onClick={() => setStep(1)} className="text-[#A3A3A3]">Atrás (Editar Titular)</Button>
                            <Button onClick={() => setStep(3)} className="bg-[#059669] text-white hover:bg-[#059669]/90 font-bold px-8">
                                Finalizar Registro <Save className="h-4 w-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* --- PASO 3: ÉXITO --- */}
                {step === 3 && (
                    <Card className="bg-[#1A1A1A] border-[#333333] text-center py-12">
                        <CardContent className="flex flex-col items-center">
                            <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-[#E5E5E5] mb-4">¡Registro Completado!</h2>
                            <p className="text-[#A3A3A3] max-w-md mx-auto mb-8 leading-relaxed">
                                Sus datos han sido recibidos correctamente por el Hotel Zafiro.
                                <br />
                                Al llegar, solo necesitará presentar su documento de identidad físico para recibir su llave.
                            </p>
                            <p className="text-sm text-[#333333]">Puede cerrar esta ventana.</p>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    )
}