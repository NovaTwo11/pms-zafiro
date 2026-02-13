import { ReservationDetailsContent } from "@/components/reservation-details-content"

export default async function ReservationPage({
                                                  params
                                              }: {
    params: Promise<{ id: string }>
}) {
    // En Next.js 15, 'params' es una promesa
    const resolvedParams = await params;

    return (
        <div className="h-full">
            <ReservationDetailsContent reservationId={resolvedParams.id} />
        </div>
    )
}