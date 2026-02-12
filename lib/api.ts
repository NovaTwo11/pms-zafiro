import axios from 'axios';
import {Product, CreateProductDto, UpdateProductDto, CashierShiftDto, CashierReportDto} from '@/types';

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

export default api;