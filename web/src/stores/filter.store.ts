/**
 * Filter store — menyimpan state filter/pencarian di client.
 * Contoh penggunaan: filter listing di halaman search.
 */

import { create } from "zustand";

interface FilterState {
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

const initialState = {
  search: "",
  category: null,
  city: null,
  minPrice: null,
  maxPrice: null,
};

export const useFilterStore = create<FilterState>()((set) => ({
  ...initialState,
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  setCity: (city) => set({ city }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice }),
  resetFilters: () => set(initialState),
}));
