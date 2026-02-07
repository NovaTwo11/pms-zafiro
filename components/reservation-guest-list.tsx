"use client"

import {
    User, CheckCircle2, AlertCircle, MapPin, Phone, Mail,
    Edit, UserPlus, PenTool, FileSignature
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ReservationGuestListProps {
    guests: any[]
    maxGuests: number
    onAddGuest?: () => void
    // MODIFICADO: Ahora aceptamos cualquier dato (el objeto guest), no solo string
    onEditGuest?: (guestData: any) => void
    onSignGuest?: (id: string, isSigned: boolean) => void
}

export function ReservationGuestList({
                                         guests,
                                         maxGuests,
                                         onAddGuest,
                                         onEditGuest,
                                         onSignGuest
                                     }: ReservationGuestListProps) {

    const renderField = (value: string | undefined, placeholder: string) => {
        if (!value) return <span className="text-[#555] italic">{placeholder}</span>
        return <span className="text-foreground">{value}</span>
    }

    const calculateCompletion = (guest: any) => {
        let score = 0;
        if (guest.primerNombre && guest.primerApellido) score += 20;
        if (guest.tipoId && guest.numeroId) score += 30;
        if (guest.nacionalidad) score += 10;
        if (guest.correo) score += 20;
        if (guest.telefono) score += 20;
        return score;
    }

    const isLimitReached = guests.length >= maxGuests

    return (
        <Card className="bg-card border-border shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
                <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        <User className="h-4 w-4 text-[#D4AF37]" /> Lista de Ocupantes
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                        Ocupación: <span className={cn("font-medium", isLimitReached ? "text-red-400" : "text-foreground")}>
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
                            ? "border-border text-[#555] cursor-not-allowed bg-transparent"
                            : "border-[#D4AF37] text-[#D4AF37] bg-primary/5 hover:bg-primary/10"
                    )}
                    onClick={isLimitReached ? undefined : onAddGuest}
                    disabled={isLimitReached}
                >
                    <UserPlus className="h-3 w-3 mr-2" />
                    {isLimitReached ? "Cupo Lleno" : "Agregar"}
                </Button>
            </CardHeader>

            <CardContent className="pt-4 px-4">
                <Accordion type="single" collapsible className="w-full space-y-3">
                    {guests.map((guest, index) => {
                        const completion = calculateCompletion(guest)
                        const isComplete = completion === 100
                        const isSigned = guest.isSigned || false

                        return (
                            <AccordionItem
                                key={index}
                                value={`guest-${index}`}
                                className="border border-border rounded-lg bg-[#262626] overflow-hidden transition-all hover:border-[#555]"
                            >
                                <AccordionTrigger className="hover:no-underline px-4 py-3 data-[state=open]:bg-card">
                                    <div className="flex items-center gap-4 w-full text-left pr-4">
                                        <Avatar className="h-10 w-10 border border-border">
                                            <AvatarFallback className="bg-background text-[#D4AF37] font-bold text-xs">
                                                {guest.primerNombre?.[0]}{guest.primerApellido?.[0]}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm text-foreground truncate">
                                                    {guest.primerNombre} {guest.primerApellido}
                                                </p>
                                                {guest.esTitular && (
                                                    <Badge variant="secondary" className="bg-primary/20 text-[#D4AF37] border-0 text-[9px] px-1.5 h-4">
                                                        TITULAR
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <span className="truncate">
                                                    {renderField(guest.tipoId, "Tipo")} {guest.numeroId || "---"}
                                                </span>
                                            </div>
                                        </div>

                                        {isSigned && <FileSignature className="h-4 w-4 text-[#D4AF37]" title="Firmado" />}

                                        {isComplete ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-orange-400 shrink-0" />
                                        )}
                                    </div>
                                </AccordionTrigger>

                                <AccordionContent className="bg-card border-t border-border px-4 py-4">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] uppercase font-semibold text-[#737373]">
                                                <span>Integridad del Perfil</span>
                                                <span className={isComplete ? "text-green-500" : "text-orange-400"}>{completion}%</span>
                                            </div>
                                            <Progress value={completion} className="h-1.5 bg-[#333333]" indicatorColor={isComplete ? "bg-green-500" : "bg-orange-400"} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="bg-[#262626] p-2 rounded border border-border flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center text-muted-foreground">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="overflow-hidden w-full">
                                                    <p className="text-[10px] text-[#737373] uppercase">Correo</p>
                                                    <p className="text-xs text-foreground truncate" title={guest.correo}>
                                                        {renderField(guest.correo, "No registrado")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-[#262626] p-2 rounded border border-border flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center text-muted-foreground">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-[#737373] uppercase">Teléfono</p>
                                                    <p className="text-xs text-foreground">
                                                        {renderField(guest.telefono, "No registrado")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-[#262626] p-2 rounded border border-border flex items-center gap-3 md:col-span-2">
                                                <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div className="grid grid-cols-2 w-full gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-[#737373] uppercase">Origen</p>
                                                        <p className="text-xs text-foreground">
                                                            {renderField(guest.ciudadOrigen, "--")}, {renderField(guest.paisOrigen, "--")}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-[#737373] uppercase">Residencia</p>
                                                        <p className="text-xs text-foreground">
                                                            {renderField(guest.ciudadResidencia, "--")}, {renderField(guest.paisResidencia, "--")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "flex-1 border-border text-xs h-8",
                                                    isSigned
                                                        ? "text-green-500 hover:text-green-400 hover:bg-green-900/10 border-green-900/30"
                                                        : "text-foreground hover:bg-[#333333]"
                                                )}
                                                onClick={() => onSignGuest?.(guest.id, isSigned)}
                                            >
                                                {isSigned ? (
                                                    <><FileSignature className="h-3 w-3 mr-2" /> Ver Firma</>
                                                ) : (
                                                    <><PenTool className="h-3 w-3 mr-2" /> Firmar Registro</>
                                                )}
                                            </Button>

                                            {/* BOTÓN DE EDITAR FUNCIONAL */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                // Pasamos el objeto COMPLETO del huésped
                                                onClick={() => onEditGuest?.(guest)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                        ...
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                                                    <DropdownMenuItem className="text-xs cursor-pointer text-red-400 hover:bg-red-900/20">Eliminar Huésped</DropdownMenuItem>
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
                    <div className="text-center py-8 text-[#737373]">
                        <User className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No hay huéspedes registrados</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}