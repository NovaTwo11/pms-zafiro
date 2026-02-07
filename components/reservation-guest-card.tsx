import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ReservationGuestCard({ guest }: { guest: any }) {
    return (
        <Card className="bg-card border-border text-foreground">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Titular Principal</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12 border border-[#D4AF37]/50">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-[#333333] text-[#D4AF37]">CG</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-lg">{guest.name}</h3>
                        <p className="text-xs text-muted-foreground">{guest.nationality}</p>
                    </div>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Documento:</span>
                        <span>{guest.docType} {guest.docNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Teléfono:</span>
                        <span>{guest.phone}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="text-[#D4AF37] truncate max-w-[150px]">{guest.email}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}