export type Guest = {
    id: string;
    nacionalidad: string; // Obligatorio
    tipoId: "CC" | "CE" | "PA" | "TI" | "RC"; // Obligatorio
    numeroId: string; // Obligatorio
    fechaCumpleanos: string; // Obligatorio
    primerNombre: string; // Obligatorio
    segundoNombre?: string;
    primerApellido: string; // Obligatorio
    segundoApellido?: string;
    telefono: string; // Obligatorio
    correo: string; // Obligatorio titular, opcional acompañante
    ocupacion: string; // Obligatorio titular
    genero: "M" | "F" | "O"; // Obligatorio
    paisResidencia: string; // Obligatorio titular
    ciudadResidencia: string; // Obligatorio titular
    paisOrigen: string; // Obligatorio titular
    ciudadOrigen: string; // Obligatorio titular
    paisDestino: string; // Obligatorio titular
    ciudadDestino: string; // Obligatorio titular
    esTitular: boolean;
};

// Soporta Punto 8 y 11 (Precios dinámicos por fecha)
export type RoomPrice = {
    date: string; // YYYY-MM-DD
    price: number;
};

// Soporta Punto 18 (Estados principal y secundario)
export type RoomStatus = "Disponible" | "Ocupada" | "Bloqueada";
export type HousekeepingStatus = "Ninguno" | "Sucia" | "Limpia" | "Pendiente de Limpieza";

export type Room = {
    id: string;
    number: string;
    category: "Estándar" | "Superior" | "Deluxe" | "Suite"; // Punto 8 (Categorías)
    basePrice: number;
    status: RoomStatus;
    housekeeping: HousekeepingStatus;
    customPrices: RoomPrice[]; // Precios específicos por fecha
};

// Soporta Punto 10 (Colores estrictos)
export type ReservationStatus =
    | "en_casa_al_dia"     // Verde
    | "en_casa_pendiente"  // Rojo
    | "confirmada_abono"   // Azul
    | "confirmada_sin_abono" // Naranja
    | "bloqueada";         // Gris

export type Reservation = {
    id: string;
    roomId: string;
    guestId: string; // ID del titular
    startDate: string;
    endDate: string;
    status: ReservationStatus;
    totalAmount: number;
    paidAmount: number;
    checkedIn: boolean;
    guests: Guest[]; // Titular + Acompañantes
};