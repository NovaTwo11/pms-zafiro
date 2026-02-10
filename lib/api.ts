import axios from 'axios';
import { Product, CreateProductDto, UpdateProductDto } from '@/types'; // Asegúrate de tener estos tipos definidos

const api = axios.create({
    baseURL: 'http://localhost:5100/api', // Tu backend .NET 9
    headers: {
        'Content-Type': 'application/json',
    },
});

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