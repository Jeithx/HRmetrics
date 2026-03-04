import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastStore {
  visible: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  visible: false,
  message: '',
  type: 'info',
  showToast: (message, type) => set({ visible: true, message, type }),
  hideToast: () => set({ visible: false }),
}));
