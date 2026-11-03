import { afterAll, describe, expect, it } from "vitest";
import prisma from "../prisma.js";

describe("PostgreSQL integration test connection", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to the dedicated test database", async () => {
    const result = await prisma.$queryRaw<
      Array<{ database: string }>
    >`SELECT current_database() AS database`;

    expect(result[0]?.database).toBe("paperless_dock_test");
  });
});