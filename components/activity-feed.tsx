"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ActivityItem } from "@/types"

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
      <div className="rounded-lg border border-border bg-card p-6 h-full flex flex-col">
        <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Actividad Reciente</h3>

        <ScrollArea className="flex-1 -mr-4 pr-4">
          <div className="space-y-6">
            {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay movimientos recientes hoy.
                </p>
            ) : (
                activities.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={item.avatar} alt={item.user} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {item.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">{item.user}</p>
                        <p className="text-xs text-muted-foreground">{item.action}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${item.amount.startsWith('+') ? 'text-[#059669]' : 'text-foreground'}`}>
                          {item.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                ))
            )}
          </div>
        </ScrollArea>
      </div>
  )
}