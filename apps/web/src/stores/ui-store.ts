import { create } from "zustand";

interface UIStore {
  bookingModalOpen: boolean;
  activeBookingId: string | null;
  openBookingModal: (bookingId: string) => void;
  closeBookingModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  bookingModalOpen: false,
  activeBookingId: null,
  openBookingModal: (bookingId) =>
    set({ bookingModalOpen: true, activeBookingId: bookingId }),
  closeBookingModal: () =>
    set({ bookingModalOpen: false, activeBookingId: null }),
}));
