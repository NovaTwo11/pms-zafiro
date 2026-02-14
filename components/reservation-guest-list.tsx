"use client"

import {
    User, CheckCircle2, AlertCircle, MapPin, Phone, Mail,
    Edit, UserPlus, PenTool, FileSignature, Flag, Trash2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { GuestDetailDto } from "@/types" // Asumiendo que existe, sino usa 'any'

interface ReservationGuestListProps {
    guests: any[] // Idealmente GuestDetailDto[]
    maxGuests: number
    onAddGuest?: () => void
    onEditGuest?: (guestData: any) => void
    onSignGuest?: (id: string, isSigned: boolean) => void
    onRemoveGuest?: (id: string) => void
}

export function ReservationGuestList({
                                         guests,
                                         maxGuests,
                                         onAddGuest,
                                         onEditGuest,
                                         onSignGuest,
                                         onRemoveGuest
                                     }: ReservationGuestListProps) {

    const renderField = (value: string | undefined, placeholder: string) => {
        if (!value || value.trim() === "") return <span className="text-muted-foreground italic text-[11px]">{placeholder}</span>
        return <span className="text-foreground font-medium">{value}</span>
    }

    // Calculadora de completitud adaptativa
    const calculateCompletion = (guest: any) => {
        let score = 0;
        const isTitular = guest.esTitular;

        // Reglas Base (Para todos)
        if (guest.primerNombre && guest.primerApellido) score += 30;
        if (guest.tipoId && guest.numeroId) score += 30;
        if (guest.nacionalidad) score += 10;

        // Reglas Específicas
        if (isTitular) {
            // El titular necesita contacto para estar al 100%
            if (guest.correo) score += 15;
            if (guest.telefono) score += 15;
        } else {
            // A los acompañantes les regalamos el puntaje de contacto ya que no es obligatorio
            score += 30;
        }

        return Math.min(score, 100);
    }

    const isLimitReached = guests.length >= maxGuests

    return (
        <Card className="bg-card border-border shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border shrink-0">
                <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" /> Lista de Ocupantes
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                        Ocupación: <span className={cn("font-medium", isLimitReached ? "text-destructive" : "text-foreground")}>
                            {guests.length}
                        </span> de <span className="text-foreground font-medium">{maxGuests}</span> permitidos
                    </CardDescription>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                        "text-xs h-8 transition-colors",
                        isLimitReached
                            ? "border-border text-muted-foreground cursor-not-allowed bg-transparent"
                            : "border-primary text-primary bg-primary/5 hover:bg-primary/10"
                    )}
                    onClick={isLimitReached ? undefined : onAddGuest}
                    disabled={isLimitReached}
                >
                    <UserPlus className="h-3 w-3 mr-2" />
                    {isLimitReached ? "Lleno" : "Agregar"}
                </Button>
            </CardHeader>

            <CardContent className="pt-4 px-4 overflow-y-auto flex-1 custom-scrollbar">
                <Accordion type="single" collapsible className="w-full space-y-3">
                    {guests.map((guest, index) => {
                        const completion = calculateCompletion(guest)
                        const isComplete = completion === 100
                        const isSigned = guest.isSigned || false
                        const isTitular = guest.esTitular;

                        return (
                            <AccordionItem
                                key={guest.id || index}
                                value={`guest-${index}`}
                                className="border border-border rounded-lg bg-card overflow-hidden transition-all hover:border-accent-foreground/30"
                            >
                                {/* HEADER DEL ACORDEÓN */}
                                <AccordionTrigger className="hover:no-underline px-4 py-3 data-[state=open]:bg-muted/40 group">
                                    <div className="flex items-center gap-4 w-full text-left pr-4">
                                        <Avatar className="h-10 w-10 border border-border bg-background">
                                            <AvatarFallback className={cn("text-xs font-bold", isTitular ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted")}>
                                                {guest.primerNombre?.[0]}{guest.primerApellido?.[0]}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm text-foreground truncate">
                                                    {guest.primerNombre} {guest.primerApellido}
                                                </p>
                                                {isTitular && (
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[9px] px-1.5 h-4">
                                                        TITULAR
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <Badge variant="outline" className="text-[10px] h-5 bg-background/50 font-normal border-border text-muted-foreground px-1.5">
                                                    {guest.tipoId || "DOC"} • {guest.numeroId || "---"}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isSigned && (
                                                <div className="bg-green-500/10 p-1.5 rounded-full" title="Firmado Digitalmente">
                                                    <FileSignature className="h-3.5 w-3.5 text-green-600" />
                                                </div>
                                            )}
                                            {isComplete ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 opacity-80" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 opacity-80" />
                                            )}
                                        </div>
                                    </div>
                                </AccordionTrigger>

                                {/* CONTENIDO DEL ACORDEÓN */}
                                <AccordionContent className="bg-card/50 border-t border-border px-4 py-4">
                                    <div className="space-y-4">

                                        {/* Barra de Progreso */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                <span>Datos del Perfil</span>
                                                <span className={isComplete ? "text-green-600" : "text-amber-500"}>{completion}%</span>
                                            </div>
                                            <Progress value={completion} className="h-1.5 bg-muted" indicatorColor={isComplete ? "bg-green-500" : "bg-amber-500"} />
                                        </div>

                                        {/* LOGICA DE VISUALIZACIÓN: TITULAR VS ACOMPAÑANTE */}
                                        {isTitular ? (
                                            /* --- VISTA COMPLETA (TITULAR) --- */
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                                {/* Email */}
                                                <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0">
                                                        <Mail className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Correo Electrónico</p>
                                                        <p className="text-xs text-foreground truncate" title={guest.correo}>
                                                            {renderField(guest.correo, "No registrado")}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Teléfono */}
                                                <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0">
                                                        <Phone className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Teléfono Móvil</p>
                                                        <p className="text-xs text-foreground">
                                                            {renderField(guest.telefono, "No registrado")}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Ubicación / Nacionalidad */}
                                                <div className="col-span-1 md:col-span-2 flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="grid grid-cols-2 w-full gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Nacionalidad</p>
                                                            <div className="flex items-center gap-1.5 text-xs text-foreground">
                                                                <Flag className="h-3 w-3 text-muted-foreground" />
                                                                {renderField(guest.nacionalidad, "Sin especificar")}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Ciudad Origen</p>
                                                            <p className="text-xs text-foreground">
                                                                {renderField(guest.ciudadOrigen, "Sin especificar")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* --- VISTA SIMPLIFICADA (ACOMPAÑANTE) --- */
                                            <div className="grid grid-cols-1 gap-3 pt-1">
                                                <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30 border border-border/50">
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                                        <Flag className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Nacionalidad</p>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {renderField(guest.nacionalidad, "No registrada")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground italic text-center px-4">
                                                    * La información de contacto no es requerida para acompañantes.
                                                </p>
                                            </div>
                                        )}

                                        {/* ACCIONES */}
                                        <div className="flex items-center gap-2 pt-3 border-t border-border mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "flex-1 border-border text-xs h-8 shadow-sm",
                                                    isSigned
                                                        ? "text-green-600 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 border-green-200"
                                                        : "text-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                                                )}
                                                onClick={() => onSignGuest?.(guest.id, isSigned)}
                                            >
                                                {isSigned ? (
                                                    <><FileSignature className="h-3.5 w-3.5 mr-2" /> Ver Firma</>
                                                ) : (
                                                    <><PenTool className="h-3.5 w-3.5 mr-2" /> Firmar Registro</>
                                                )}
                                            </Button>

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80"
                                                onClick={() => onEditGuest?.(guest)}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted">
                                                        ...
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem
                                                        className="text-xs cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                                        onClick={() => onRemoveGuest?.(guest.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>

                {guests.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border mt-4">
                        <User className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm font-medium">Sin huéspedes</p>
                        <p className="text-xs opacity-70">Agrega ocupantes a la reserva</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}