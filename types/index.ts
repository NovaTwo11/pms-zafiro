// types/index.ts

// ==========================================
// 1. ENUMS Y TIPOS BASE (BACKEND & SHARED)
// ==========================================

export type BackendRoomStatus = "Available" | "Occupied" | "Dirty" | "TouchUp" | "Maintenance" | "Blocked";
export type BackendReservationStatus = "Pending" | "Confirmed" | "CheckedIn" | "CheckedOut" | "Cancelled" | "NoShow";
export type DocumentType = "CC" | "CE" | "PA" | "TI" | "RC";

// ✅ NUEVO: Enums para Caja y Finanzas
export type FolioStatus = 'Open' | 'Closed';
export type TransactionType = 'Charge' | 'Payment' | 'Adjustment';
export type PaymentMethod = 'None' | 'Cash' | 'CreditCard' | 'DebitCard' | 'Transfer';
export type CashierShiftStatus = 'Open' | 'Closed';

// Mapeo inverso opcional si lo necesitas en UI
export const RoomStatusMap: Record<number, BackendRoomStatus> = {
    0: 'Available',
    1: 'Occupied',
    2: 'Dirty',
    3: 'Maintenance',
    4: 'TouchUp',
    5: 'Blocked'
};

// ==========================================
// 2. CONTRATOS DEL BACKEND (DTOs)
// Lo que llega crudo de la API
// ==========================================

// GET /api/rooms
export interface RoomDto {
    id: string;
    number: string;
    category: string; // Backend envía string
    basePrice: number;
    status: BackendRoomStatus;
    capacity?: number; // Agregado por si el backend lo envía
    floor?: number;    // Agregado por si el backend lo envía
}

// GET /api/guests
export interface GuestDto {
    id: string;
    firstName: string;
    lastName: string;
    documentType: DocumentType;
    documentNumber: string;
    email: string;
    phone: string;
    nationality: string;
    birthDate?: string; // YYYY-MM-DD
    notes?: string;
}

// GET /api/reservations
export interface ReservationDto {
    id: string;
    code: string; // ConfirmationCode
    status: BackendReservationStatus;
    mainGuestId: string;
    mainGuestName: string; // Helper enviado por backend
    roomId: string;
    roomNumber: string;    // Helper enviado por backend
    startDate: string; // ISO String CheckIn
    endDate: string;   // ISO String CheckOut
    nights: number;
    totalAmount?: number;
    adults?: number;
    children?: number;
}

// ==========================================
// 3. NUEVOS DTOs PARA CAJA Y FOLIOS
// ==========================================

export interface CashierShift {
    id: string;
    userId: string;
    openedAt: string;
    closedAt?: string;
    startingAmount: number;
    systemCalculatedAmount: number;
    actualAmount: number;
    status: CashierShiftStatus;
}

export interface FolioTransaction {
    id: string;
    folioId: string;
    type: TransactionType;
    description: string;
    amount: number;
    quantity: number;
    unitPrice: number;
    createdAt: string;
    createdByUserId: string;

    // Campos para Caja
    paymentMethod: PaymentMethod;
    cashierShiftId?: string;
}

export interface Folio {
    id: string;
    status: FolioStatus;
    balance: number;
    transactions: FolioTransaction[];
    reservationId?: string;
    alias?: string;
}

export interface DashboardStats {
    occupancyRate: number;
    arrivalsToday: number;
    departuresToday: number;
    inHouseGuests: number;
    revenueToday: number;
}

// ==========================================
// 4. TIPOS DE LA APLICACIÓN (FRONTEND / UI)
// Tipos enriquecidos para componentes React
// ==========================================

export type RoomCategory = "Doble" | "Familiar" | "Suite" | "Estándar" | "Superior" | "Deluxe";

// Estados visuales (Semáforo)
export type VisualReservationStatus =
    | "check_in_paid"
    | "check_in_debt"
    | "confirmed_deposit"
    | "confirmed_no_deposit"
    | "blocked"
    | "available"
    | "history";

// Entidad 'Room' enriquecida para UI
export interface Room extends Omit<RoomDto, 'status' | 'category'> {
    category: RoomCategory;
    status: BackendRoomStatus;
    // Propiedades visuales derivadas
    housekeepingStatus?: "Limpia" | "Sucia" | "Mantenimiento";
    amenities?: string[]; // Si decides parsear el JSON
}

// ==========================================
// 5. FORMULARIOS
// ==========================================

export interface GuestFormValues {
    nombre: string;
    apellido: string;
    tipoDocumento: string;
    numeroDocumento: string;
    email: string;
    telefono: string;
    nacionalidad: string;
    fechaNacimiento?: Date;
    ocupacion?: string;
    genero?: string;
    paisResidencia?: string;
    ciudadResidencia?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    unitPrice: number;
    stock: number;
    category: string;
    imageUrl?: string;
    isActive: boolean;
    createdAt: string;
}

export interface CreateProductDto {
    name: string;
    description?: string;
    unitPrice: number;
    stock: number;
    category: string;
    imageUrl?: string;
}

export interface UpdateProductDto extends CreateProductDto {
    id: string;
    imageUrl?: string;
    isActive: boolean;
}