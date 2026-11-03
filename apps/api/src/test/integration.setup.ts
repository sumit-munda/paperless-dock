import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const testEnvironmentPath = resolve(currentDirectory, "../../.env.test");

const result = dotenv.config({
  path: testEnvironmentPath,
  override: true,
});

if (result.error) {
  throw new Error(`Failed to load test environment: ${result.error.message}`);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from .env.test.");
}

const databaseName = new URL(databaseUrl).pathname.replace("/", "");

if (databaseName !== "paperless_dock_test") {
  throw new Error(
    `Integration tests cannot run against "${databaseName}". ` +
      "Expected paperless_dock_test.",
  );
}

console.log("Integration tests connected to the test database.");
