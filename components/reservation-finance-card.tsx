import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function ReservationFinanceCard({ financial }: { financial: any }) {
    return (
        <Card className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#A3A3A3] uppercase tracking-wider">Estado Financiero</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Total Reserva</span>
                    <span className="font-bold text-lg">${financial.total.toLocaleString()}</span>
                </div>
                <Separator className="bg-[#333333] my-2" />
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-[#059669]">
                        <span>Pagado</span>
                        <span>${financial.paid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#CF6679] font-medium">
                        <span>Pendiente</span>
                        <span>${financial.pending.toLocaleString()}</span>
                    </div>
                </div>
                <Button className="w-full mt-4 bg-[#333333] hover:bg-[#404040]" size="sm">
                    <CreditCard className="h-3 w-3 mr-2" />
                    Registrar Pago
                </Button>
            </CardContent>
        </Card>
    )
}