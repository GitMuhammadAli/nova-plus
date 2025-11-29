import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: any;
}

interface UIState {
  sidebarOpen: boolean;
  modals: Record<string, ModalState>;
  theme: 'light' | 'dark' | 'system';
  notifications: any[];
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (type: string, data?: any) => void;
  closeModal: (type: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  modals: {},
  theme: 'system',
  notifications: [],
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  openModal: (type, data) => set((state) => ({
    modals: {
      ...state.modals,
      [type]: { isOpen: true, type, data: data || null },
    },
  })),
  
  closeModal: (type) => set((state) => {
    const newModals = { ...state.modals };
    delete newModals[type];
    return { modals: newModals };
  }),
  
  setTheme: (theme) => set({ theme }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now().toString() }],
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
}));

