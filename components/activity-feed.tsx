"use client"

import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { CreditCard, UserPlus, BedDouble, Coffee } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "payment",
    message: "Juan registró pago en Hab 201",
    amount: "$250,000",
    time: new Date(Date.now() - 1000 * 60 * 5),
    icon: CreditCard,
  },
  {
    id: 2,
    type: "checkin",
    message: "Check-in completado Hab 305",
    guest: "Sr. García",
    time: new Date(Date.now() - 1000 * 60 * 15),
    icon: UserPlus,
  },
  {
    id: 3,
    type: "cleaning",
    message: "Hab 102 marcada como limpia",
    time: new Date(Date.now() - 1000 * 60 * 30),
    icon: BedDouble,
  },
  {
    id: 4,
    type: "pos",
    message: "Venta Bar cargada a Hab 201",
    amount: "$45,000",
    time: new Date(Date.now() - 1000 * 60 * 45),
    icon: Coffee,
  },
  {
    id: 5,
    type: "payment",
    message: "Abono recibido Hab 408",
    amount: "$180,000",
    time: new Date(Date.now() - 1000 * 60 * 60),
    icon: CreditCard,
  },
]

export function ActivityFeed() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-serif text-lg font-semibold text-foreground">Actividad Reciente</h3>
      <p className="text-sm text-muted-foreground">Últimos movimientos</p>

      <div className="mt-4 space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <div className="rounded-lg bg-accent p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{activity.message}</p>
                {activity.amount && <p className="text-xs text-[#D4AF37]">{activity.amount}</p>}
                {activity.guest && <p className="text-xs text-muted-foreground">{activity.guest}</p>}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(activity.time, {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
