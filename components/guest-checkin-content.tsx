"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Plus, User, ArrowRight, Save, Trash2, X, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import api from "@/lib/api" // Importa tu instancia de Axios

// Tipo para el formulario de huésped
type GuestForm = {
    id?: string // Para identificar en la lista
    primerNombre: string
    segundoNombre: string
    primerApellido: string
    segundoApellido: string
    tipoId: string
    numeroId: string
    fechaCumpleanos: string
    genero: string
    nacionalidad: string
    telefono: string
    correo: string
    ocupacion: string
    paisResidencia: string
    ciudadResidencia: string
    paisOrigen: string
    ciudadOrigen: string
    paisDestino: string
    ciudadDestino: string
}

// Estado inicial limpio
const emptyGuestState: GuestForm = {
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    tipoId: "CC",
    numeroId: "",
    fechaCumpleanos: "",
    genero: "M",
    nacionalidad: "",
    telefono: "",
    correo: "",
    ocupacion: "",
    paisResidencia: "",
    ciudadResidencia: "",
    paisOrigen: "",
    ciudadOrigen: "",
    paisDestino: "",
    ciudadDestino: "",
}

interface GuestCheckInContentProps {
    reservationCode: string
}

export function GuestCheckInContent({ reservationCode }: GuestCheckInContentProps) {
    const [step, setStep] = useState(1) // 1: Titular, 2: Acompañantes, 3: Finalizado

    // Estados de API
    const [isLoadingInit, setIsLoadingInit] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [realReservationId, setRealReservationId] = useState<string>("")

    // Datos del Titular
    const [mainGuest, setMainGuest] = useState<GuestForm>(emptyGuestState)

    // Datos de Acompañantes
    const [companions, setCompanions] = useState<GuestForm[]>([])
    const [isAddingCompanion, setIsAddingCompanion] = useState(false)
    const [newCompanion, setNewCompanion] = useState<GuestForm>(emptyGuestState)

    // --- CARGA INICIAL DE DATOS ---
    useEffect(() => {
        const fetchReservation = async () => {
            try {
                // Llama al endpoint de backend que creamos
                const response = await api.get(`/reservations/by-code/${reservationCode}`)
                const data = response.data

                setRealReservationId(data.id)

                // Mapeo de datos del Backend al Frontend
                if (data.mainGuest) {
                    setMainGuest({
                        ...emptyGuestState,
                        primerNombre: data.mainGuest.primerNombre || "",
                        segundoNombre: data.mainGuest.segundoNombre || "",
                        primerApellido: data.mainGuest.primerApellido || "",
                        segundoApellido: data.mainGuest.segundoApellido || "",
                        correo: data.mainGuest.email || "",
                        telefono: data.mainGuest.phone || "",
                        numeroId: data.mainGuest.documentNumber || "",
                        tipoId: data.mainGuest.documentType || "CC",
                        nacionalidad: data.mainGuest.nationality || "",
                        ciudadOrigen: data.mainGuest.cityOfOrigin || "",
                        fechaCumpleanos: data.mainGuest.birthDate || ""
                    })
                }
            } catch (error) {
                console.error("Error fetching reservation:", error)
                toast.error("No pudimos cargar la reserva", {
                    description: "Verifica que el link de check-in sea correcto."
                })
            } finally {
                setIsLoadingInit(false)
            }
        }

        fetchReservation()
    }, [reservationCode])


    // --- MANEJADORES ---

    const handleMainGuestChange = (field: keyof GuestForm, value: string) => {
        setMainGuest((prev) => ({ ...prev, [field]: value }))
    }

    const handleNewCompanionChange = (field: keyof GuestForm, value: string) => {
        setNewCompanion((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmitTitular = (e: React.FormEvent) => {
        e.preventDefault()
        setStep(2)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const saveCompanion = (e: React.FormEvent) => {
        e.preventDefault()
        // Validación básica para acompañante
        if (!newCompanion.primerNombre || !newCompanion.primerApellido || !newCompanion.numeroId) {
            toast.error("Nombre, Apellido y Documento son obligatorios")
            return
        }

        setCompanions([...companions, { ...newCompanion, id: crypto.randomUUID() }])
        setNewCompanion(emptyGuestState)
        setIsAddingCompanion(false)
        toast.success("Acompañante agregado")
    }

    const removeCompanion = (id: string) => {
        setCompanions(companions.filter(c => c.id !== id))
        toast.info("Acompañante eliminado")
    }

    const handleFinalize = async () => {
        setIsSaving(true)
        try {
            // Empaquetamos todo para enviarlo al backend
            const payload = {
                mainGuest: mainGuest,
                companions: companions
            }

            // Llamamos al POST para completar el check-in online
            await api.post(`/reservations/${realReservationId}/online-checkin`, payload)

            // Si todo sale bien, avanzamos al paso 3 (Éxito)
            setStep(3)
            window.scrollTo({ top: 0, behavior: "smooth" })

        } catch (error) {
            console.error("Error al guardar checkin", error)
            toast.error("Ocurrió un error al procesar su solicitud", {
                description: "Por favor, inténtelo de nuevo en unos minutos."
            })
        } finally {
            setIsSaving(false)
        }
    }

    // --- RENDERIZADO DE FORMULARIO (Reutilizable para Titular y Acompañante) ---
    const renderFormFields = (
        data: GuestForm,
        onChange: (field: keyof GuestForm, value: string) => void,
        isCompanion: boolean = false
    ) => (
        <div className="space-y-6">
            {/* IDENTIFICACIÓN */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 border-b border-border pb-1">
                    Identificación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Primer Nombre *</Label>
                        <Input className="bg-background border-border" required value={data.primerNombre} onChange={(e) => onChange("primerNombre", e.target.value)} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Segundo Nombre</Label>
                        <Input className="bg-background border-border" value={data.segundoNombre} onChange={(e) => onChange("segundoNombre", e.target.value)} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Primer Apellido *</Label>
                        <Input className="bg-background border-border" required value={data.primerApellido} onChange={(e) => onChange("primerApellido", e.target.value)} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Segundo Apellido</Label>
                        <Input className="bg-background border-border" value={data.segundoApellido} onChange={(e) => onChange("segundoApellido", e.target.value)} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Tipo Documento *</Label>
                        <Select value={data.tipoId} onValueChange={(v) => onChange("tipoId", v)} disabled={isSaving}>
                            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-card border-border text-white">
                                <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                <SelectItem value="PA">Pasaporte</SelectItem>
                                <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Número Documento *</Label>
                        <Input className="bg-background border-border" required value={data.numeroId} onChange={(e) => onChange("numeroId", e.target.value)} disabled={isSaving}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Fecha Nacimiento</Label>
                            <Input type="date" className="bg-background border-border [color-scheme:dark]" value={data.fechaCumpleanos} onChange={(e) => onChange("fechaCumpleanos", e.target.value)} disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Género</Label>
                            <Select value={data.genero} onValueChange={(v) => onChange("genero", v)} disabled={isSaving}>
                                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-card border-border text-white">
                                    <SelectItem value="M">Masculino</SelectItem>
                                    <SelectItem value="F">Femenino</SelectItem>
                                    <SelectItem value="O">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Nacionalidad</Label>
                        <Input className="bg-background border-border" value={data.nacionalidad} onChange={(e) => onChange("nacionalidad", e.target.value)} disabled={isSaving}/>
                    </div>
                </div>
            </div>

            {/* CONTACTO - Opcional para acompañantes */}
            <div className="space-y-4 pt-4">
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 border-b border-border pb-1">
                    Contacto y Perfil
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Email {isCompanion ? '(Opcional)' : '*'}</Label>
                        <Input type="email" className="bg-background border-border" required={!isCompanion} value={data.correo} onChange={(e) => onChange("correo", e.target.value)} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Teléfono {isCompanion ? '(Opcional)' : '*'}</Label>
                        <Input className="bg-background border-border" required={!isCompanion} value={data.telefono} onChange={(e) => onChange("telefono", e.target.value)} disabled={isSaving}/>
                    </div>
                </div>
            </div>

            {/* UBICACIÓN */}
            {!isCompanion && (
                <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 border-b border-border pb-1">
                        Ubicación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">País Residencia *</Label>
                            <Input className="bg-background border-border" required value={data.paisResidencia} onChange={(e) => onChange("paisResidencia", e.target.value)} disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Ciudad Residencia *</Label>
                            <Input className="bg-background border-border" required value={data.ciudadResidencia} onChange={(e) => onChange("ciudadResidencia", e.target.value)} disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">País Origen *</Label>
                            <Input className="bg-background border-border" required value={data.paisOrigen} onChange={(e) => onChange("paisOrigen", e.target.value)} disabled={isSaving}/>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Ciudad Origen *</Label>
                            <Input className="bg-background border-border" required value={data.ciudadOrigen} onChange={(e) => onChange("ciudadOrigen", e.target.value)} disabled={isSaving}/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    // --- PANTALLA DE CARGA INICIAL ---
    if (isLoadingInit) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37] mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Hotel Zafiro</h2>
                <p className="text-muted-foreground">Buscando tu reserva...</p>
            </div>
        )
    }

    // --- PANTALLA DE ERROR SI NO HAY ID REAL ---
    if (!realReservationId) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
                <X className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Reserva no encontrada</h2>
                <p className="text-muted-foreground mb-6">El código <strong>{reservationCode}</strong> no coincide con ninguna reserva activa.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-10 px-4 animate-in fade-in duration-500">

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#D4AF37] mb-2 font-[family-name:var(--font-heading)]">Hotel Zafiro</h1>
                <p className="text-muted-foreground">Registro de Huéspedes</p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-[#bg-background] text-xs font-mono text-foreground">
                    Reserva: {reservationCode}
                </div>
            </div>

            <div className="w-full max-w-3xl space-y-6">

                {/* --- PASO 1: FORMULARIO TITULAR --- */}
                {step === 1 && (
                    <Card className="bg-card border-border shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Badge className="bg-primary text-black hover:bg-primary">1</Badge>
                                Datos del Titular
                            </CardTitle>
                            <CardDescription>
                                Por favor complete todos los campos obligatorios (*) para agilizar su ingreso.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmitTitular}>
                            <CardContent>
                                {renderFormFields(mainGuest, handleMainGuestChange)}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90 font-bold h-12" disabled={isSaving}>
                                    Guardar y Continuar <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* --- PASO 2: ACOMPAÑANTES --- */}
                {step === 2 && (
                    <div className="space-y-6">
                        <Card className="bg-card border-border shadow-lg">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-foreground flex items-center gap-2">
                                            <Badge className="bg-primary text-black hover:bg-primary">2</Badge>
                                            Acompañantes
                                        </CardTitle>
                                        <CardDescription>
                                            Agregue las personas que se hospedarán con usted.
                                        </CardDescription>
                                    </div>
                                    {!isAddingCompanion && companions.length > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-[#D4AF37] text-[#D4AF37] hover:bg-primary/10"
                                            onClick={() => setIsAddingCompanion(true)}
                                            disabled={isSaving}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Agregar Otro
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">

                                {/* LISTA DE ACOMPAÑANTES AGREGADOS */}
                                {companions.length > 0 && (
                                    <div className="grid grid-cols-1 gap-3 mb-6">
                                        {companions.map((comp, idx) => (
                                            <div key={comp.id || idx} className="flex items-center justify-between p-3 rounded bg-background border border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-[#333333] flex items-center justify-center">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {comp.primerNombre} {comp.primerApellido}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {comp.tipoId}: {comp.numeroId}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeCompanion(comp.id!)}
                                                    className="text-[#CF6679] hover:text-red-500 hover:bg-red-500/10"
                                                    disabled={isSaving}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ESTADO VACÍO */}
                                {companions.length === 0 && !isAddingCompanion && (
                                    <div className="text-center py-10 border-2 border-dashed border-border rounded-lg bg-background">
                                        <Users className="h-10 w-10 text-[#333333] mx-auto mb-3" />
                                        <p className="text-muted-foreground mb-4">No hay acompañantes registrados aún.</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsAddingCompanion(true)}
                                            className="border-[#D4AF37] text-[#D4AF37] hover:bg-primary/10"
                                            disabled={isSaving}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Agregar Acompañante
                                        </Button>
                                    </div>
                                )}

                                {/* FORMULARIO DE AGREGAR ACOMPAÑANTE */}
                                {isAddingCompanion && (
                                    <div className="border border-[#D4AF37]/30 rounded-lg p-4 bg-background animate-in slide-in-from-top-4">
                                        <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                                            <h4 className="text-[#D4AF37] font-medium">Nuevo Acompañante</h4>
                                            <Button variant="ghost" size="sm" onClick={() => setIsAddingCompanion(false)} disabled={isSaving}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <form onSubmit={saveCompanion}>
                                            {renderFormFields(newCompanion, handleNewCompanionChange, true)}
                                            <div className="flex justify-end gap-2 mt-6">
                                                <Button type="button" variant="ghost" onClick={() => setIsAddingCompanion(false)} className="text-muted-foreground" disabled={isSaving}>
                                                    Cancelar
                                                </Button>
                                                <Button type="submit" className="bg-primary text-black hover:bg-primary/90" disabled={isSaving}>
                                                    Guardar Acompañante
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                            </CardContent>

                            {/* Footer de navegación */}
                            {!isAddingCompanion && (
                                <CardFooter className="flex justify-between border-t border-border pt-6">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground hover:text-white" disabled={isSaving}>
                                        Atrás (Editar Titular)
                                    </Button>
                                    <Button onClick={handleFinalize} className="bg-[#059669] text-white hover:bg-[#059669]/90 font-bold px-8" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : "Finalizar Registro"}
                                        {!isSaving && <Save className="h-4 w-4 ml-2" />}
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </div>
                )}

                {/* --- PASO 3: ÉXITO --- */}
                {step === 3 && (
                    <Card className="bg-card border-border text-center py-12 shadow-2xl">
                        <CardContent className="flex flex-col items-center">
                            <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-4">¡Registro Completado!</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                                Sus datos y los de sus {companions.length} acompañante(s) han sido recibidos correctamente por el Hotel Zafiro.
                                <br /><br />
                                <span className="text-[#D4AF37] font-medium">¡Bienvenido!</span>
                            </p>
                            <Button variant="outline" className="border-border text-muted-foreground" onClick={() => window.close()}>
                                Cerrar Ventana
                            </Button>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    )
}