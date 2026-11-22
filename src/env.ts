import dotenv from "dotenv";
dotenv.config();

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`CRITICAL: ${name} missing from .env file`);
    }
    return value;
};

export const env = {
    PORT: parseInt(process.env.PORT || "3000", 10),
    DATABASE_URL: required("DATABASE_URL"),
    JWT_SECRET: required("JWT_SECRET"),
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    SQIDS_ALPHABET: required("SQIDS_ALPHABET"),
    UPLOADS_DIR: required("UPLOADS_DIR"),
    IMAGES_DIR: required("IMAGES_DIR"),
    PFPS_DIR: required("PFPS_DIR"),
    BASE_URL: required("BASE_URL"),
};