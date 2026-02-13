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
        if (!value) return <span className="text-muted-foreground italic">{placeholder}</span>
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
                                className="border border-border rounded-lg bg-card overflow-hidden transition-all hover:border-accent-foreground/30"
                            >
                                <AccordionTrigger className="hover:no-underline px-4 py-3 data-[state=open]:bg-muted/40">
                                    <div className="flex items-center gap-4 w-full text-left pr-4">
                                        <Avatar className="h-10 w-10 border border-border">
                                            <AvatarFallback className="bg-muted text-primary font-bold text-xs">
                                                {guest.primerNombre?.[0]}{guest.primerApellido?.[0]}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm text-foreground truncate">
                                                    {guest.primerNombre} {guest.primerApellido}
                                                </p>
                                                {guest.esTitular && (
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[9px] px-1.5 h-4">
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

                                        {isSigned && (
                                            <span title="Firmado" className="flex items-center">
                                                <FileSignature className="h-4 w-4 text-primary" />
                                            </span>
                                        )}
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
                                            <div className="flex justify-between text-[10px] uppercase font-semibold text-muted-foreground">
                                                <span>Integridad del Perfil</span>
                                                <span className={isComplete ? "text-green-500" : "text-orange-400"}>{completion}%</span>
                                            </div>
                                            <Progress value={completion} className="h-1.5 bg-border" indicatorColor={isComplete ? "bg-green-500" : "bg-orange-400"} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="bg-muted p-2 rounded border border-border flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center text-muted-foreground">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="overflow-hidden w-full">
                                                    <p className="text-[10px] text-muted-foreground uppercase">Correo</p>
                                                    <p className="text-xs text-foreground truncate" title={guest.correo}>
                                                        {renderField(guest.correo, "No registrado")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-muted p-2 rounded border border-border flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center text-muted-foreground">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase">Teléfono</p>
                                                    <p className="text-xs text-foreground">
                                                        {renderField(guest.telefono, "No registrado")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-muted p-2 rounded border border-border flex items-center gap-3 md:col-span-2">
                                                <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div className="grid grid-cols-2 w-full gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase">Origen</p>
                                                        <p className="text-xs text-foreground">
                                                            {renderField(guest.ciudadOrigen, "--")}, {renderField(guest.paisOrigen, "--")}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase">Residencia</p>
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
                                                        ? "text-green-600 hover:text-green-700 hover:bg-green-500/10 border-green-500/30 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-900/20"
                                                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                                )}
                                                onClick={() => onSignGuest?.(guest.id, isSigned)}
                                            >
                                                {isSigned ? (
                                                    <><FileSignature className="h-3 w-3 mr-2" /> Ver Firma</>
                                                ) : (
                                                    <><PenTool className="h-3 w-3 mr-2" /> Firmar Registro</>
                                                )}
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                                                onClick={() => onEditGuest?.(guest)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent">
                                                        ...
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                                                    <DropdownMenuItem className="text-xs cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive">
                                                        Eliminar Huésped
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
                    <div className="text-center py-8 text-muted-foreground">
                        <User className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No hay huéspedes registrados</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}