import axios from 'axios';
import {
    Product,
    CreateProductDto,
    UpdateProductDto,
    CashierShiftDto,
    CashierReportDto,
    DashboardStats,
    RevenueChartData, DemographicData, ActivityItem
} from '@/types';
import {GuestFormData} from "@/components/checkin-wizard";

// 1. Re-exportamos los tipos
export type { CashierShiftDto, CashierReportDto };

console.log("API URL ACTUAL:", process.env.NEXT_PUBLIC_API_URL);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100/api';

// 2. Exportamos instancia de axios
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
    getRevenueHistory: async (): Promise<RevenueChartData[]> => {
        const response = await api.get('/dashboard/revenue-history');
        return response.data;
    },
    getDemographics: async (): Promise<DemographicData[]> => {
        const response = await api.get('/dashboard/demographics');
        return response.data;
    },
    getRecentActivity: async (): Promise<ActivityItem[]> => {
        const response = await api.get('/dashboard/recent-activity');
        return response.data;
    }
};

export interface CheckInResponse {
    message: string;
    folioId: string;
    status: string;
}

export async function updateGuestInfo(reservationId: string, data: GuestFormData & { companions: GuestFormData[] }) {
    const res = await fetch(`${API_URL}/reservations/${reservationId}/guests`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            // Mapeo para coincidir con el DTO de C#
            nacionalidad: data.nacionalidad,
            tipoId: data.tipoId,
            numeroId: data.numeroId,
            primerNombre: data.primerNombre,
            primerApellido: data.primerApellido,
            segundoNombre: data.segundoNombre,
            segundoApellido: data.segundoApellido,
            telefono: data.telefono,
            correo: data.correo,
            direccion: data.direccion,
            ciudadOrigen: data.ciudadOrigen,
            // Mapear acompañantes
            companions: data.companions?.map(c => ({
                primerNombre: c.primerNombre,
                primerApellido: c.primerApellido,
                numeroId: c.numeroId,
                nacionalidad: c.nacionalidad
            })) || []
        }),
    })

    if (!res.ok) {
        const error = await res.text()
        throw new Error(error || "Error al actualizar información del huésped")
    }

    return res.json()
}

export async function checkInReservation(id: string) {
    const res = await fetch(`${API_URL}/reservations/${id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al realizar Check-in")
    }

    return res.json()
}

export const cashierApi = {
    getStatus: async () => {
        try {
            const response = await api.get<CashierShiftDto>('/cashier/status');
            return response.data || null;
        } catch (error) {
            return null;
        }
    },
    openShift: async (startingAmount: number) => {
        const response = await api.post<CashierShiftDto>('/cashier/open', { startingAmount });
        return response.data;
    },
    // --- NUEVO MÉTODO PARA MOVIMIENTOS ---
    addMovement: async (data: { type: string; amount: number; description: string }) => {
        const response = await api.post('/cashier/movement', data);
        return response.data;
    },
    getReport: async () => {
        const response = await api.get<CashierReportDto>('/cashier/report');
        return response.data;
    },
    closeShift: async (actualAmount: number) => {
        const response = await api.post<CashierShiftDto>('/cashier/close', { actualAmount });
        return response.data;
    }
};

export const productsApi = {
    getAll: async () => {
        const response = await api.get<Product[]>('/products');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },
    create: async (data: CreateProductDto) => {
        const response = await api.post<Product>('/products', data);
        return response.data;
    },
    update: async (id: string, data: UpdateProductDto) => {
        const response = await api.put(`/products/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        await api.delete(`/products/${id}`);
    }
};

export const reservationsApi = {
    getById: async (id: string) => {
        const response = await api.get(`/reservations/${id}`);
        return response.data;
    },
    checkout: async (id: string) => {
        const response = await api.post(`/reservations/${id}/checkout`);
        return response.data;
    },
    cancel: async (id: string) => {
        const response = await api.post(`/reservations/${id}/cancel`);
        return response.data;
    },
    split: async (id: string, data: { segmentIndex: number, splitDate: string, newRoomId: string | null }) => {
        const response = await api.post(`/reservations/${id}/segments/split`, data);
        return response.data;
    },
    merge: async (id: string) => {
        const response = await api.post(`/reservations/${id}/segments/merge`);
        return response.data;
    },
    moveSegment: async (id: string, segmentIndex: number, newRoomId: string) => {
        const response = await api.post(`/reservations/${id}/segments/${segmentIndex}/move`, { newRoomId });
        return response.data;
    },
    ensureFolio: async (id: string) => {
        const response = await api.post(`/reservations/${id}/ensure-folio`);
        return response.data; // Retorna { folioId: string }
    },
    getAvailableRoomsForMove: async (reservationId: string) => {
        // Idealmente: GET /reservations/{id}/available-rooms-move
        // Por ahora simulamos una llamada a Rooms filtrando en cliente o un endpoint simple
        const response = await api.get('/rooms');
        return response.data.filter((r: any) => r.status === 'Available');
    }
};

export default api;