import { create } from "zustand"
import { cashierApi } from "@/lib/api";
import {CashierShiftDto} from "@/types";

// --- SESSION STORE (Simplificado: Solo usuario Admin) ---
interface User {
    id: string
    name: string
    role: string
    avatar?: string
}

interface SessionState {
    user: User | null
    setUser: (user: User | null) => void
}

export const useSessionStore = create<SessionState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}))

// --- POS STORE (Sin cambios, solo limpieza visual) ---
interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    image?: string
}

interface POSState {
    items: CartItem[]
    addItem: (item: Omit<CartItem, "quantity">) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    total: () => number
}

export const usePOSStore = create<POSState>((set, get) => ({
    items: [],
    addItem: (item) =>
        set((state) => {
            const existing = state.items.find((i) => i.id === item.id)
            if (existing) {
                return {
                    items: state.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)),
                }
            }
            return { items: [...state.items, { ...item, quantity: 1 }] }
        }),
    removeItem: (id) =>
        set((state) => ({
            items: state.items.filter((i) => i.id !== id),
        })),
    updateQuantity: (id, quantity) =>
        set((state) => ({
            items:
                quantity <= 0
                    ? state.items.filter((i) => i.id !== id)
                    : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
    clearCart: () => set({ items: [] }),
    total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}))

// --- SIDEBAR STORE ---
interface SidebarState {
    isCollapsed: boolean
    toggleSidebar: () => void
    setCollapsed: (collapsed: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
    isCollapsed: false,
    toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
}))

// --- CASHIER STORE ---
interface CashierState {
    isShiftOpen: boolean;
    currentShift: CashierShiftDto | null;
    isLoading: boolean;
    checkStatus: () => Promise<void>;
    setShift: (shift: CashierShiftDto | null) => void;
    refreshReport: () => Promise<void>; // Nueva acción para actualizar tras cobros
}

export const useCashierStore = create<CashierState>((set, get) => ({
    isShiftOpen: false,
    currentShift: null,
    isLoading: true,
    setShift: (shift) => set({
        currentShift: shift,
        isShiftOpen: shift !== null && shift.status === 0
    }),
    checkStatus: async () => {
        set({ isLoading: true });
        try {
            const shift = await cashierApi.getStatus();
            set({
                currentShift: shift,
                isShiftOpen: shift !== null && shift.status === 0
            });
        } catch (e) {
            set({ currentShift: null, isShiftOpen: false });
        } finally {
            set({ isLoading: false });
        }
    },
    refreshReport: async () => {
        // Reutilizamos checkStatus para traer la data más reciente
        const { isShiftOpen } = get();
        if (isShiftOpen) {
            await get().checkStatus();
        }
    }
}))