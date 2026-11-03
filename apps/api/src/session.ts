import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const environmentFilePath = resolve(currentDirectory, "../.env");

dotenv.config({ path: environmentFilePath });

import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be configured.");
}

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters long.");
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

const PostgreSQLSessionStore = connectPgSimple(session);

const sessionStore = new PostgreSQLSessionStore({
  pool,
  tableName: "session",
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15,
});

const sessionMiddleware = session({
  name: "paperless-dock.sid",
  secret: sessionSecret,
  store: sessionStore,

  resave: false,

  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});

export default sessionMiddleware;
