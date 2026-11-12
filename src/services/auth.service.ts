import {sessions, users} from "@/db/schema.ts";
import {eq} from "drizzle-orm";
import {ConflictError, InternalServerError, NotFoundError, UnauthorizedError} from "@/utils/errors.js";
import * as argon2 from 'argon2';
import {getJwtSecret} from "@/config/jwt.ts";
import {db} from "@/db/db.ts";
import {createHash, randomBytes} from "node:crypto";
import {SignJWT} from "jose";
import {createUserService} from "@/services/user.service.ts";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const loginService = async (username: string,
                                   password: string) => {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user || !user.passwordHash) throw new NotFoundError('User Not Found');

    if (!(await argon2.verify(user.passwordHash, password))) throw new UnauthorizedError();

    const sessionToken = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(sessionToken).digest('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(sessions).values({tokenHash: hash, userId: user.userId, expiresAt: expiresAt});

    const secret = await getJwtSecret();

    return await new SignJWT({sessionToken: sessionToken})
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.userId)
        .setIssuer('https://yipshare.oelohey.dev')
        .setAudience('https://yipshare.oelohey.dev')
        .sign(secret);
}

export const registerService = async (name: string,
                                      paternalSurname: string,
                                      maternalSurname: string,
                                      email: string,
                                      phoneNumber: string,
                                      username: string,
                                      password: string) => {
    const user = await createUserService(name, paternalSurname, maternalSurname, email, phoneNumber, username, password);
    if (!user) throw new InternalServerError("Failed to register user");

    const session_token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(session_token).digest('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(sessions).values({tokenHash: hash, userId: user.userId, expiresAt: expiresAt});

    const secret = await getJwtSecret();

    return await new SignJWT({session_token: session_token})
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.userId)
        .setIssuer('https://yipshare.oelohey.dev')
        .setAudience('https://yipshare.oelohey.dev')
        .sign(secret);
}

export const logoutService = async (sessionHash: string) => {
    await db.delete(sessions).where(eq(sessions.tokenHash, sessionHash));
}