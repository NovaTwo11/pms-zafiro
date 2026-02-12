import axios from 'axios';
import {Product, CreateProductDto, UpdateProductDto, CashierShiftDto, CashierReportDto} from '@/types'; // Asegúrate de tener estos tipos definidos

console.log("API URL ACTUAL:", process.env.NEXT_PUBLIC_API_URL); // <--- AGREGA ESTO
// Selecciona la URL de la variable de entorno o usa localhost como respaldo
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const cashierApi = {
    getStatus: async () => {
        // Retorna 204 (null) si no hay caja, o el objeto si hay
        try {
            const response = await api.get<CashierShiftDto>('/cashier/status');
            return response.data || null; // Manejo del NoContent
        } catch (error) {
            return null;
        }
    },
    openShift: async (startingAmount: number) => {
        const response = await api.post<CashierShiftDto>('/cashier/open', { startingAmount });
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

// Definimos el servicio de productos aquí para mantener el código limpio en los componentes
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

export default api;