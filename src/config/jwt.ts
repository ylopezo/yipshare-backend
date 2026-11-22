import * as jose from 'jose'
import {env} from "@/env.ts";

export const JWT_ISSUER = 'https://yipshare.oelohey.dev';
export const JWT_AUDIENCE = 'https://yipshare.oelohey.dev';

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is missing!')
}

export const getJwtSecret = async () => {
    return await jose.importJWK(
        {
            kty: 'oct',
            k: Buffer.from(env.JWT_SECRET!, 'hex').toString('base64url'),
            alg: 'HS256'
        },
        'HS256'
    )
}