import { create } from "zustand";
import type { UIStore } from "@/types/store";

export const useUIStore = create<UIStore>((set) => ({
  bookingModalOpen: false,
  activeBookingId: null,
  openBookingModal: (bookingId) =>
    set({ bookingModalOpen: true, activeBookingId: bookingId }),
  closeBookingModal: () =>
    set({ bookingModalOpen: false, activeBookingId: null }),
}));
