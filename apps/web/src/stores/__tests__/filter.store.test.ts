import { describe, it, expect, beforeEach } from "vitest";
import { useFilterStore } from "../filter.store";

describe("filter.store", () => {
  beforeEach(() => {
    useFilterStore.getState().resetFilters();
  });

  it("should have correct initial state", () => {
    const state = useFilterStore.getState();
    expect(state.search).toBe("");
    expect(state.category).toBeNull();
    expect(state.city).toBeNull();
    expect(state.minPrice).toBeNull();
    expect(state.maxPrice).toBeNull();
  });

  it("setSearch should update search", () => {
    useFilterStore.getState().setSearch("kost");
    const state = useFilterStore.getState();
    expect(state.search).toBe("kost");
  });

  it("setCategory should update category", () => {
    useFilterStore.getState().setCategory("room");
    const state = useFilterStore.getState();
    expect(state.category).toBe("room");
  });

  it("setCategory should accept null", () => {
    useFilterStore.getState().setCategory("room");
    useFilterStore.getState().setCategory(null);
    const state = useFilterStore.getState();
    expect(state.category).toBeNull();
  });

  it("setCity should update city", () => {
    useFilterStore.getState().setCity("Jakarta");
    const state = useFilterStore.getState();
    expect(state.city).toBe("Jakarta");
  });

  it("setPriceRange should update min and max", () => {
    useFilterStore.getState().setPriceRange(1000000, 5000000);
    const state = useFilterStore.getState();
    expect(state.minPrice).toBe(1000000);
    expect(state.maxPrice).toBe(5000000);
  });

  it("setPriceRange should accept null values", () => {
    useFilterStore.getState().setPriceRange(1000000, 5000000);
    useFilterStore.getState().setPriceRange(null, null);
    const state = useFilterStore.getState();
    expect(state.minPrice).toBeNull();
    expect(state.maxPrice).toBeNull();
  });

  it("resetFilters should reset all to initial state", () => {
    useFilterStore.getState().setSearch("test");
    useFilterStore.getState().setCategory("room");
    useFilterStore.getState().setCity("Bandung");
    useFilterStore.getState().setPriceRange(500000, 2000000);

    useFilterStore.getState().resetFilters();

    const state = useFilterStore.getState();
    expect(state.search).toBe("");
    expect(state.category).toBeNull();
    expect(state.city).toBeNull();
    expect(state.minPrice).toBeNull();
    expect(state.maxPrice).toBeNull();
  });

  it("multiple setters should work independently", () => {
    useFilterStore.getState().setSearch("kost");
    useFilterStore.getState().setCity("Surabaya");

    const state = useFilterStore.getState();
    expect(state.search).toBe("kost");
    expect(state.city).toBe("Surabaya");
    expect(state.category).toBeNull();
  });
});
