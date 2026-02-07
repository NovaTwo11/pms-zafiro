import { Calendar, Users, CheckCircle, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function ReservationStayCard({ stay, guestName }: { stay: any, guestName: string }) {
    return (
        <Card className="bg-card border-border text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Detalles de la Estancia</CardTitle>
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none">Confirmada con Abono</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-background rounded-lg border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Check-in</span>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#D4AF37]" />
                            <span className="font-bold">{format(stay.checkIn, "dd MMM yyyy", { locale: es })}</span>
                        </div>
                    </div>
                    <div className="p-3 bg-background rounded-lg border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Check-out</span>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#D4AF37]" />
                            <span className="font-bold">{format(stay.checkOut, "dd MMM yyyy", { locale: es })}</span>
                        </div>
                    </div>
                    <div className="p-3 bg-background rounded-lg border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Duración</span>
                        <span className="font-bold">{stay.nights} Noches</span>
                    </div>
                    <div className="p-3 bg-background rounded-lg border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Habitación</span>
                        <span className="font-bold text-[#D4AF37]">{stay.room}</span>
                    </div>
                </div>

                <Separator className="bg-[#333333] my-6" />

                <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Huéspedes Registrados
                    </h3>

                    <div className="space-y-2">
                        {/* Titular */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="font-medium">{guestName}</span>
                                <Badge variant="secondary" className="text-[10px] bg-[#333333] text-muted-foreground">Titular</Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">Editar</Button>
                        </div>

                        {/* Acompañante Pendiente */}
                        <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-card/50">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <span className="text-sm">Acompañante 2 (Faltan datos)</span>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-xs border-border hover:bg-[#333333]">
                                Solicitar Datos
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}