// types/index.ts

// ==========================================
// 1. ENUMS Y TIPOS BASE (SHARED)
// ==========================================

export type BackendRoomStatus = "Available" | "Occupied" | "Dirty" | "TouchUp" | "Maintenance" | "Blocked";
export type BackendReservationStatus = "Pending" | "Confirmed" | "CheckedIn" | "CheckedOut" | "Cancelled" | "NoShow";
export type DocumentType = "CC" | "CE" | "PA" | "TI" | "RC" | "Passport";

// Enums Financieros
export type FolioStatus = 'Open' | 'Closed';
export type TransactionType = 'Charge' | 'Payment' | 'Adjustment';
export type PaymentMethod = 'None' | 'Cash' | 'CreditCard' | 'DebitCard' | 'Transfer';
export type CashierShiftStatus = 'Open' | 'Closed';

// Categorías de Habitación (Frontend constraint)
export type RoomCategory = "Doble" | "Triple" | "Familiar" | "SuiteFamiliar";

// ==========================================
// 2. DTOs DEL BACKEND (Respuestas de API)
// ==========================================

// GET /api/rooms
export interface RoomDto {
    id: string;
    number: string;
    floor: number; // Agregado obligatoriamente tras la migración
    category: string;
    basePrice: number;
    status: BackendRoomStatus;
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
    createdAt: string;
}

// GET /api/reservations
export interface ReservationDto {
    id: string;
    confirmationCode: string; // Corregido: en tu seed es ConfirmationCode
    status: BackendReservationStatus;
    guestId: string;
    mainGuestName?: string; // Opcional si el backend hace include
    roomId: string;
    checkIn: string;  // ISO Date
    checkOut: string; // ISO Date
    totalAmount: number;
    adults: number;
    children: number;
}

// GET /api/products
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

// ==========================================
// 3. DTOs DE CREACIÓN/EDICIÓN (Requests)
// ==========================================

export interface CreateRoomDto {
    number: string;
    floor: number;
    category: string;
    basePrice: number;
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
    isActive: boolean;
}

// ==========================================
// 4. TIPOS DE UI (Frontend Only)
// ==========================================

// Estados visuales del Dashboard (Semáforo)
export type VisualReservationStatus =
    | "check_in_paid"
    | "check_in_debt"
    | "confirmed_deposit"
    | "confirmed_no_deposit"
    | "blocked"
    | "available"
    | "history";

// Interfaz enriquecida para el componente de Habitaciones
export interface Room extends Omit<RoomDto, 'category'> {
    category: RoomCategory | string;
    // Propiedades derivadas en el cliente
    visualStatus?: VisualReservationStatus;
}