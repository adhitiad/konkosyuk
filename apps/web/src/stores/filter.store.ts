/**
 * Filter store — menyimpan state filter/pencarian di client.
 * Contoh penggunaan: filter listing di halaman search.
 */

import { create } from "zustand";
import type { FilterState } from "@/types/store";

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
