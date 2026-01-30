import { GuestCheckInContent } from "@/components/guest-checkin-content"

interface PageProps {
    params: {
        code: string
    }
}

export default function GuestCheckInPage({ params }: PageProps) {
    return <GuestCheckInContent reservationCode={params.code} />
}