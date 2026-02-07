import { Calendar, BedDouble, Users, Clock, MapPin } from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function ReservationGeneralInfo({ reservation }: { reservation: any }) {
    const checkIn = parseISO(reservation.startDate)
    const checkOut = parseISO(reservation.endDate)
    const nights = differenceInDays(checkOut, checkIn)

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#333333]">

                    {/* Sección Fechas */}
                    <div className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-[#D4AF37] mt-1" />
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Llegada</p>
                                <p className="text-lg font-bold text-foreground capitalize">
                                    {format(checkIn, "EEEE, d MMM yyyy", { locale: es })}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> 15:00 Check-in
                                </p>
                            </div>
                        </div>
                        <Separator className="bg-[#333333]" />
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Salida</p>
                                <p className="text-lg font-bold text-foreground capitalize">
                                    {format(checkOut, "EEEE, d MMM yyyy", { locale: es })}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> 12:00 Check-out
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sección Alojamiento */}
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Habitación Asignada</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-[#D4AF37]">{reservation.roomId}</span>
                                    <span className="text-sm text-foreground bg-[#333333] px-2 py-0.5 rounded">Estándar</span>
                                </div>
                            </div>
                            <BedDouble className="h-8 w-8 text-[#333333]" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-background p-2 rounded border border-border">
                                <p className="text-[10px] text-muted-foreground uppercase">Estadía</p>
                                <p className="text-sm font-bold text-foreground">{nights} Noches</p>
                            </div>
                            <div className="bg-background p-2 rounded border border-border">
                                <p className="text-[10px] text-muted-foreground uppercase">Ocupación</p>
                                <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                                    <Users className="h-3 w-3" /> 2 Adultos
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}