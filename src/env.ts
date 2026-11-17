import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const SQIDS_ALPHABET = process.env.SQIDS_ALPHABET;

if (!DATABASE_URL) {
    throw new Error("CRITICAL: DATABASE_URL missing from .env file");
}

if (!JWT_SECRET) {
    throw new Error("CRITICAL: JWT_SECRET missing from .env file");
}

if (!SQIDS_ALPHABET) {
    throw new Error("SQIDS_ALPHABET missing from .env file");
}
export const env = {
    PORT: parseInt(process.env.PORT || "3000", 10),
    DATABASE_URL,
    JWT_SECRET,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    SQIDS_ALPHABET,
};
