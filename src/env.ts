import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const SQIDS_ALPHABET = process.env.SQIDS_ALPHABET;
const UPLOADS_DIR = process.env.UPLOADS_DIR;
const IMAGES_DIR = process.env.IMAGES_DIR;
const PFPS_DIR = process.env.PFPS_DIR;
const BASE_URL = process.env.BASE_URL;

if (!DATABASE_URL) {
    throw new Error("CRITICAL: DATABASE_URL missing from .env file");
}

if (!JWT_SECRET) {
    throw new Error("CRITICAL: JWT_SECRET missing from .env file");
}

if (!SQIDS_ALPHABET) {
    throw new Error("SQIDS_ALPHABET missing from .env file");
}

if (!UPLOADS_DIR) {
    throw new Error("UPLOADS_DIR missing from .env file");
}

if (!IMAGES_DIR) {
    throw new Error("IMAGES_DIR missing from .env file");
}

if (!PFPS_DIR) {
    throw new Error("PFPS_DIR missing from .env file");
}

if (!BASE_URL) {
    throw new Error("BASE_URL missing from .env file");
}

export const env = {
    PORT: parseInt(process.env.PORT || "3000", 10),
    DATABASE_URL,
    JWT_SECRET,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    SQIDS_ALPHABET,
    UPLOADS_DIR,
    IMAGES_DIR,
    PFPS_DIR,
    BASE_URL,
};
