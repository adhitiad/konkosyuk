/**
 * Tipe-tipe store: AuthState, FilterState, UIStore.
 */

export interface AuthState {
  isAuthenticated: boolean;
  userName: string | null;
  userImage: string | null;
  setAuth: (name: string, image: string | null) => void;
  clearAuth: () => void;
}

export interface FilterState {
  search: string;
  category: string | null;
  city: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  setSearch: (search: string) => void;
  setCategory: (category: string | null) => void;
  setCity: (city: string | null) => void;
  setPriceRange: (minPrice: number | null, maxPrice: number | null) => void;
  resetFilters: () => void;
}

export interface UIStore {
  bookingModalOpen: boolean;
  activeBookingId: string | null;
  openBookingModal: (bookingId: string) => void;
  closeBookingModal: () => void;
}
