import { ReservationDetailsContent } from "@/components/reservation-details-content"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ReservationPage({ params }: PageProps) {
    const { id } = await params;

    return <ReservationDetailsContent reservationId={id} />
}