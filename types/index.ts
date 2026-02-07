export type GuestProfile = {
    id: string;
    nacionalidad: string;
    tipoId: "CC" | "CE" | "PA" | "TI" | "RC";
    numeroId: string;
    fechaCumpleanos: string;
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    telefono: string;
    correo: string;
    ocupacion: string;
    genero: "M" | "F" | "O";
    paisResidencia: string;
    ciudadResidencia: string;
};

// Datos volátiles específicos de esta reserva
export type GuestStayDetails = {
    paisOrigen: string;
    ciudadOrigen: string;
    paisDestino: string;
    ciudadDestino: string;
    esTitular: boolean;
};

// Intersección para uso en formularios y reservas (Mantiene compatibilidad con tu código actual)
export type ReservationGuest = GuestProfile & GuestStayDetails;

export type RoomPrice = {
    date: string; // YYYY-MM-DD
    price: number;
};

export type RoomStatus = "Disponible" | "Ocupada" | "Bloqueada";
export type HousekeepingStatus = "Ninguno" | "Sucia" | "Limpia" | "Pendiente de Limpieza";

export type Room = {
    id: string;
    number: string;
    category: "Estándar" | "Superior" | "Deluxe" | "Suite";
    basePrice: number;
    status: RoomStatus;
    housekeeping: HousekeepingStatus;
    customPrices: RoomPrice[];
};

export type ReservationStatus =
    | "en_casa_al_dia"
    | "en_casa_pendiente"
    | "confirmada_abono"
    | "confirmada_sin_abono"
    | "bloqueada";

export type Reservation = {
    id: string;
    roomId: string;
    guestId: string; // ID del titular (Profile ID)
    startDate: string;
    endDate: string;
    status: ReservationStatus;
    totalAmount: number;
    paidAmount: number;
    checkedIn: boolean;
    guests: ReservationGuest[]; // Lista de huéspedes con sus datos de estadía
};