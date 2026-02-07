import { Metadata } from "next"
import { GuestCheckInContent } from "@/components/guest-checkin-content"

export const metadata: Metadata = {
    title: "Check-in Online | Hotel Zafiro",
    description: "Portal de registro de huéspedes",
}

interface PageProps {
    params: Promise<{ code: string }>
}

export default async function GuestCheckInPage({ params }: PageProps) {
    // Manejo de params asíncronos para Next.js 15+
    const { code } = await params

    return <GuestCheckInContent reservationCode={code} />
}