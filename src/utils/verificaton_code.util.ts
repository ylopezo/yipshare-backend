import crypto from 'node:crypto';
import {env} from "@/env.ts";

export function generateVerificationCodeUtil(length = 8) : string {
    const bytes = crypto.randomBytes(length);
    let newCode = '';

    for (let i = 0; i < bytes.length; i++) {
        newCode += env.SQIDS_ALPHABET[bytes[i]! & 31];
    }

    return newCode;
}

export function normalizeCode(input: string) : string{
    return input
        .toUpperCase()
        .replace(/[\s-]/g, '')
        .replaceAll('I', 'L')
        .replaceAll('1', 'L')
}