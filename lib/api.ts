import axios from 'axios';
import { toast } from 'sonner'; // Asegúrate de tener sonner instalado
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

// 2. Helper para leer cookies en el cliente (sin librerías extra)
function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
}

// 3. Exportamos instancia de axios
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- INTERCEPTORES DE AUTENTICACIÓN ---

// Request: Inyectar Token
api.interceptors.request.use(
    (config) => {
        const token = getCookie('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response: Manejar errores globales (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Solo redirigimos si no estamos ya en el login para evitar bucles
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                toast.error("Sesión expirada. Por favor ingrese nuevamente.");
                // Opcional: Borrar cookie aquí
                document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --- FIN INTERCEPTORES ---

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
    // Nota: fetch nativo NO usa los interceptores de axios.
    // Debemos inyectar el header manualmente si usamos fetch.
    const token = getCookie('token');

    const res = await fetch(`${API_URL}/reservations/${reservationId}/guests`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
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

/**
 * Cierra la sesión del usuario eliminando el token y redirigiendo al login.
 */
export function logout() {
    // 1. Eliminar la cookie del token (poniendo fecha de expiración en el pasado)
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    // 2. Redirigir forzosamente al login para limpiar el estado de la aplicación
    window.location.href = '/login';
}

export async function checkInReservation(id: string) {
    const token = getCookie('token');
    const res = await fetch(`${API_URL}/reservations/${id}/checkin`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
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
        return response.data;
    },
    getAvailableRoomsForMove: async (reservationId: string) => {
        const response = await api.get('/rooms');
        return response.data.filter((r: any) => r.status === 'Available');
    }
};

export default api;