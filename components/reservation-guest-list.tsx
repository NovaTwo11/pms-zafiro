import { User, CheckCircle, AlertCircle, MapPin, Phone, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Aquí usaríamos el tipo Guest real
export function ReservationGuestList({ guests, maxGuests }: { guests: any[], maxGuests: number }) {

  // Función helper para verificar completitud (simulada)
  const isGuestComplete = (guest: any) => {
      // Verificaríamos todos los campos obligatorios del type Guest
      return guest.numeroId && guest.nacionalidad && guest.paisOrigen;
  }

  return (
    <Card className="bg-[#1A1A1A] border-[#333333]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[#A3A3A3] uppercase tracking-wider">
           Lista de Ocupantes ({guests.length}/{maxGuests})
        </CardTitle>
        <Button size="sm" variant="outline" className="h-8 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10">
           <User className="h-3 w-3 mr-2" /> Agregar Acompañante
        </Button>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-2">
           {guests.map((guest, index) => {
              const complete = isGuestComplete(guest)
              return (
                <AccordionItem key={index} value={`item-${index}`} className="border border-[#333333] rounded-lg bg-[#0F0F0F] px-2">
                  <AccordionTrigger className="hover:no-underline py-3">
                     <div className="flex items-center gap-3 text-left">
                        {complete ?
                           <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> :
                           <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                        }
                        <div>
                           <p className="font-bold text-sm text-[#E5E5E5]">
                              {guest.primerNombre} {guest.primerApellido}
                           </p>
                           <p className="text-xs text-[#A3A3A3]">
                              {guest.tipoId} {guest.numeroId} • {guest.nacionalidad}
                           </p>
                        </div>
                        {guest.esTitular && <Badge variant="secondary" className="ml-2 text-[10px] h-5 bg-[#333333]">Titular</Badge>}
                     </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pt-1 border-t border-[#333333] mt-2">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-xs mt-2">
                        <div className="flex items-center gap-2 text-[#A3A3A3]">
                           <Mail className="h-3 w-3" /> {guest.correo || "Sin correo"}
                        </div>
                        <div className="flex items-center gap-2 text-[#A3A3A3]">
                           <Phone className="h-3 w-3" /> {guest.telefono || "Sin teléfono"}
                        </div>
                        <div className="flex items-center gap-2 text-[#A3A3A3] col-span-2">
                           <MapPin className="h-3 w-3" /> Residencia: {guest.ciudadResidencia}, {guest.paisResidencia}
                        </div>
                         <div className="flex items-center gap-2 text-[#A3A3A3] col-span-2">
                           <MapPin className="h-3 w-3" /> Procedencia: {guest.ciudadOrigen}, {guest.paisOrigen}
                        </div>
                     </div>
                     <div className="mt-3 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-[#A3A3A3]">Editar Datos</Button>
                     </div>
                  </AccordionContent>
                </AccordionItem>
              )
           })}
        </Accordion>
      </CardContent>
    </Card>
  )
}