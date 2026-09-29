import { create } from "zustand";

interface UiState {
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    sidebarCollapsed: window.innerWidth < 1024,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));