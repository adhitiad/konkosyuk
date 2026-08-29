/**
 * Auth store — menyimpan state autentikasi di client.
 * Hanya data yang perlu diakses cepat di client (bukan secret/token).
 * Data sensitif (token, session) tetap di-handle oleh better-auth di server.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState } from "@/types/store";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userName: null,
      userImage: null,
      setAuth: (name, image) =>
        set({ isAuthenticated: true, userName: name, userImage: image }),
      clearAuth: () =>
        set({
          isAuthenticated: false,
          userName: null,
          userImage: null,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userName: state.userName,
        userImage: state.userImage,
      }),
    },
  ),
);
