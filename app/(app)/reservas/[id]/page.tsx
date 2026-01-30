import { ReservationDetailsContent } from "@/components/reservation-details-content"

interface PageProps {
    params: {
        id: string
    }
}

export default function ReservationPage({ params }: PageProps) {
    return <ReservationDetailsContent reservationId={params.id} />
}