import {sessions, users} from "@/db/schema.ts";
import {eq} from "drizzle-orm";
import {NotFoundError, UnauthorizedError} from "@/utils/errors.js";
import * as argon2 from 'argon2';
import {getJwtSecret} from "@/config/jwt.ts";
import {db} from "@/db/db.ts";
import {createHash, randomBytes} from "node:crypto";
import {SignJWT} from "jose";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const loginService = async (username: string, password: string) => {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user || !user.passwordHash) throw new NotFoundError('User Not Found');

    if (!(await argon2.verify(user.passwordHash, password))) throw new UnauthorizedError()

    const session_token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(session_token).digest('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(sessions).values({token_hash: hash, userId: user.userId, expiresAt: expiresAt});

    const secret = await getJwtSecret();

    return await new SignJWT({session_token: session_token})
        .setSubject(user.userId)
        .setIssuer('https://yipshare.oelohey.dev')
        .setAudience('https://yipshare.oelohey.dev')
        .setExpirationTime('30d')
        .sign(secret)
}