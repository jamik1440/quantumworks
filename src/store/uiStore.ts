// Global state management using Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    modalStack: string[];

    // Actions
    setTheme: (theme: 'light' | 'dark') => void;
    toggleSidebar: () => void;
    toggleTheme: () => void;
    openModal: (modalId: string) => void;
    closeModal: () => void;
    closeAllModals: () => void;
}

export const useUIStore = create<UIState>()(
    devtools(
        persist(
            (set) => ({
                theme: 'dark',
                sidebarOpen: true,
                modalStack: [],

                setTheme: (theme) => set({ theme }),

                toggleTheme: () => set((state) => ({
                    theme: state.theme === 'light' ? 'dark' : 'light'
                })),

                toggleSidebar: () => set((state) => ({
                    sidebarOpen: !state.sidebarOpen
                })),

                openModal: (modalId) => set((state) => ({
                    modalStack: [...state.modalStack, modalId]
                })),

                closeModal: () => set((state) => ({
                    modalStack: state.modalStack.slice(0, -1)
                })),

                closeAllModals: () => set({ modalStack: [] }),
            }),
            {
                name: 'ui-storage',
                partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
            }
        )
    )
);
