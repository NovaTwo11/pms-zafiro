// ==========================================
// 1. CONTRATOS DEL BACKEND (DTOs)
// Estos deben coincidir EXACTAMENTE con el C#
// ==========================================

export type BackendRoomStatus = "Available" | "Occupied" | "Dirty" | "Maintenance" | "Blocked";
export type BackendReservationStatus = "Pending" | "Confirmed" | "CheckedIn" | "CheckedOut" | "Cancelled" | "NoShow";
export type DocumentType = "CC" | "CE" | "PA" | "TI" | "RC";

// Lo que devuelve GET /api/rooms
export interface RoomDto {
    id: string;
    number: string;
    category: string; // El backend envía string, nosotros lo validamos en el front
    basePrice: number;
    status: BackendRoomStatus;
}

// Lo que devuelve GET /api/guests
export interface GuestDto {
    id: string;
    firstName: string;      // Antes: primerNombre
    lastName: string;       // Antes: primerApellido
    documentType: DocumentType; // Antes: tipoId
    documentNumber: string; // Antes: numeroId
    email: string;
    phone: string;
    nationality: string;
    birthDate?: string;     // YYYY-MM-DD
}

// Lo que devuelve GET /api/reservations
export interface ReservationDto {
    id: string;
    code: string;
    status: BackendReservationStatus;
    mainGuestId: string;
    mainGuestName: string;
    roomId: string;
    roomNumber: string;
    startDate: string; // ISO String
    endDate: string;   // ISO String
    nights: number;
    totalAmount?: number; // Puede venir nulo si no se calculó
}

// ==========================================
// 2. TIPOS DE LA APLICACIÓN (FRONTEND)
// Adaptados para que tu UI funcione cómoda
// ==========================================

// Tus categorías de negocio restringidas
export type RoomCategory = "Doble" | "Familiar" | "Suite" | "Estándar" | "Superior" | "Deluxe";

// Estados visuales (Mantiene tu lógica de colores)
export type VisualReservationStatus =
    | "check_in_paid"       // Verde
    | "check_in_debt"       // Rojo
    | "confirmed_deposit"   // Azul
    | "confirmed_no_deposit"// Naranja
    | "blocked"             // Gris
    | "available";          // Blanco

// Entidad 'Room' enriquecida para el uso en componentes React
export interface Room extends Omit<RoomDto, 'status' | 'category'> {
    category: RoomCategory;
    // Mantenemos 'status' del backend, pero agregamos el visual si lo necesitas
    status: BackendRoomStatus;
    // Propiedades visuales derivadas (opcionales)
    housekeepingStatus?: "Limpia" | "Sucia" | "Mantenimiento";
}

// ==========================================
// 3. COMPATIBILIDAD CON TU FORMULARIO
// ==========================================

// Perfil extendido para formularios (mezcla datos reales con datos de UI)
export interface GuestFormValues {
    nombre: string;         // Mapear a firstName al enviar
    apellido: string;       // Mapear a lastName al enviar
    tipoDocumento: string;  // Mapear a documentType
    numeroDocumento: string;
    email: string;
    telefono: string;
    nacionalidad: string;
    fechaNacimiento?: Date;

    // Campos que el backend AÚN NO TIENE (Ojo con esto)
    // Si los envías, el backend los ignorará por ahora
    ocupacion?: string;
    genero?: string;
    paisResidencia?: string;
    ciudadResidencia?: string;
}