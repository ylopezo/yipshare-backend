import Sqids from "sqids";
import {env} from "@/env.ts";
import {NotFoundError} from "@/utils/errors";

const sqids = new Sqids({
    alphabet: env.SQIDS_ALPHABET,
    minLength: 6,
});

export function encodeInvCode(code: number): string {
    const unformattedCode = sqids.encode([code]);
    const len = unformattedCode.length;
    if (len >= 6 && len <= 8) {
        const mid = Math.ceil(len / 2);
        return `${unformattedCode.slice(0, mid)}-${unformattedCode.slice(mid)}`;
    } else {
        return unformattedCode.match(/.{1,4}/g)!.join('-');
    }
}

export function decodeInvCode(code: string): number {
    const unformattedCode = code
        .toUpperCase()
        .replaceAll('-', '')
        .replaceAll('I', 'L')
        .replaceAll('1', 'L')

    const potentialCode = sqids.decode(unformattedCode);
    if (potentialCode.length !== 1 || sqids.encode(potentialCode) != unformattedCode) throw new NotFoundError('Resource not found')
    return potentialCode[0]!;
}