import dotenv from "dotenv";
import {isFourInt32} from "@/utils/env_util.util.ts";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const CODE_SCRAMBLING_KEYS = process.env.CODE_SCRAMBLING_KEYS;

if (!DATABASE_URL) {
    throw new Error("CRITICAL: DATABASE_URL missing from .env file");
}

if (!JWT_SECRET) {
    throw new Error("CRITICAL: JWT_SECRET missing from .env file");
}

if (!CODE_SCRAMBLING_KEYS) {
    throw new Error("CODE_SCRAMBLING_KEYS missing from .env file");
}

const PARSED_KEYS = JSON.parse(CODE_SCRAMBLING_KEYS);

if (!PARSED_KEYS || isFourInt32(PARSED_KEYS)) {
    throw new Error("CODE_SCRAMBLING_KEYS is malformed");
}

export const env = {
    PORT: parseInt(process.env.PORT || "3000", 10),
    DATABASE_URL,
    JWT_SECRET,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    CODE_SCRAMBLING_KEYS: JSON.parse(CODE_SCRAMBLING_KEYS),
};
