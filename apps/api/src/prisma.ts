import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const environmentFilePath = resolve(currentDirectory, "../.env");

dotenv.config({ path: environmentFilePath });

const prisma = new PrismaClient();

export default prisma;
