import dotenv from "dotenv";
dotenv.config();

export const env = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
}

if (!env.DATABASE_URL) throw new Error("CRITICAL: DATABASE_URL missing from .env file")
if (!env.JWT_SECRET) throw new Error("CRITICAL: JWT_SECRET missing from .env file")