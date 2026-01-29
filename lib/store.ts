import { create } from "zustand"

interface User {
  id: string
  name: string
  role: string
  avatar?: string
}

interface SessionState {
  user: User | null
  isShiftOpen: boolean
  shiftStartTime: Date | null
  setUser: (user: User | null) => void
  openShift: () => void
  closeShift: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isShiftOpen: false,
  shiftStartTime: null,
  setUser: (user) => set({ user }),
  openShift: () => set({ isShiftOpen: true, shiftStartTime: new Date() }),
  closeShift: () => set({ isShiftOpen: false, shiftStartTime: null }),
}))

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

interface SidebarState {
  isCollapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
}))
