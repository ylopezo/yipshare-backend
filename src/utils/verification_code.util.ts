import crypto from "node:crypto";
import { CODE_ALPHABET } from "@/utils/sqids.util.ts";

export function generateVerificationCodeUtil(length = 8): string {
    const bytes = crypto.randomBytes(length);
    let newCode = "";

    for (let i = 0; i < bytes.length; i++) {
        newCode += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
    }

    return newCode;
}

export function normalizeCode(input: string): string {
    return input.toUpperCase().replace(/[\s-]/g, "").replaceAll("I", "L").replaceAll("1", "L");
}
