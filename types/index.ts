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
    code: string; // C# envía 'Code' (ConfirmationCode)
    status: BackendReservationStatus;
    statusStep: number;

    roomId: string;
    roomName: string;

    mainGuestId: string;
    mainGuestName: string;

    checkIn: string;
    checkOut: string;
    nights: number;
    adults: number;
    children: number;
    origin: string;
    createdDate: string;
    notes: string;

    totalAmount: number;
    paidAmount: number;
    balance: number;
    folioId?: string; // Guid nullable

    // Las listas que faltaban
    segments: ReservationSegmentDto[];
    guests: GuestDetailDto[];
    folioItems: FolioItemDto[];
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
    isStockTracked: boolean;
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
    isStockTracked: boolean;
}

export interface ReservationSegmentDto {
    roomId: string;
    roomNumber: string;
    start: string;
    end: string;
}

export interface GuestDetailDto {
    id: string;
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    correo: string;
    telefono: string;
    paisOrigen: string;
    ciudadOrigen?: string;
    paisResidencia: string;
    ciudadResidencia: string;
    direccionResidencia: string;
    tipoId: string;
    numeroId: string;
    nacionalidad: string;
    fechaNacimiento?: string;
    ocupacion: string;
    esTitular: boolean;
    isSigned: boolean;
}

export interface FolioItemDto {
    id: string;
    date: string;
    concept: string;
    qty: number;
    price: number;
    total: number;
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

// ==========================================
// 5. CRASHIER ENTITIES
// ==========================================
export interface CashierShiftDto {
    id: string;
    userId: string;
    openedAt: string;
    closedAt?: string;
    startingAmount: number;
    systemCalculatedAmount: number;
    actualAmount: number;
    status: number; // 0: Open, 1: Closed (Según tu Enum en Backend)
}

export interface CashierReportDto {
    totalIncome: number;
    totalCash: number;
    totalCards: number;
    totalTransfers: number;
    totalRoomCharges: number;
    totalTransactions: number;
}

// ==========================================
// 6. DASHBOARD ENTITIES
// ==========================================

export interface RoomStatusCounts {
    clean: number;
    dirty: number;
    maintenance: number;
    occupied: number;
}

export interface DashboardStats {
    occupancyRate: number;
    totalRevenue: number;
    checkInsPending: number;
    checkOutsPending: number;
    roomStatusCounts: RoomStatusCounts;
}

export interface RevenueChartData {
    name: string
    ingresos: number
    gastos: number
}

export interface DemographicData {
    name: string
    value: number
}

export interface ActivityItem {
    id: string
    user: string
    action: string
    time: string
    amount: string
    avatar: string
    initials: string
}