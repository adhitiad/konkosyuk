import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../auth.store";

describe("auth.store", () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      userName: null,
      userImage: null,
    });
  });

  it("should have correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userName).toBeNull();
    expect(state.userImage).toBeNull();
  });

  it("setAuth should update state correctly", () => {
    useAuthStore.getState().setAuth("John", "https://img.com/john.jpg");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.userName).toBe("John");
    expect(state.userImage).toBe("https://img.com/john.jpg");
  });

  it("setAuth should handle null image", () => {
    useAuthStore.getState().setAuth("Jane", null);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.userName).toBe("Jane");
    expect(state.userImage).toBeNull();
  });

  it("clearAuth should reset to initial state", () => {
    useAuthStore.getState().setAuth("John", "https://img.com/john.jpg");
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userName).toBeNull();
    expect(state.userImage).toBeNull();
  });

  it("should persist isAuthenticated and userName", () => {
    useAuthStore.getState().setAuth("Test", null);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.userName).toBe("Test");
  });
});
