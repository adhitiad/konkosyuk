import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

afterEach(() => {
  cleanup();
});
