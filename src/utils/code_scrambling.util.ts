import {env} from "@/env.ts";

function roundFunction(half: number, key: number) {
    let x = (half ^ key) >>> 0;
    x = Math.imul(x, 0x45d9f3b) >>> 0;
    return ((x >>> 16) ^ x) & 0xffff;
}

export function encodeInvitationCode(num: number): string {
    let left = (num >>> 16) & 0xffff;
    let right = num & 0xffff;

    for (let i = 0; i < 4; i++) {
        const nextLeft = right;
        const nextRight = left ^ roundFunction(right, env.CODE_SCRAMBLING_KEYS[i]!);
        left = nextLeft;
        right = nextRight;
    }

    const scrambled = ((left << 16) | right) >>> 0;

    return scrambled.toString(36).toUpperCase().padStart(7, '0');
}

export function decodeInvitationCode(code: string) {
    const scrambled = parseInt(code, 36) >>> 0;

    let left = (scrambled >>> 16) & 0xffff;
    let right = scrambled & 0xffff;

    for (let i = 3; i >= 0; i--) {
        const prevRight = left;
        left = right ^ roundFunction(left, env.CODE_SCRAMBLING_KEYS[i]!);
        right = prevRight;
    }

    return ((left << 16) | right) >>> 0;
}