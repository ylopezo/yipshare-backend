import type {Request, Response, NextFunction, RequestHandler} from 'express';
import {type JWTPayload, jwtVerify} from "jose";
import {getJwtSecret} from "@/config/jwt.ts";
import {db} from "@/db/db.ts";
import {sessions} from "@/db/schema.ts";
import {eq} from "drizzle-orm";
import {createHash} from "node:crypto";
import {UnauthorizedError} from "@/utils/errors";

export interface UserSession {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface AuthenticatedRequest extends Request {
    session: UserSession;
    condominiumId?: string | null;
}
interface SessionPayload extends JWTPayload {
    sessionToken: string;
}

type AuthenticatedHandler = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => Promise<any> | any;

export const withAuth = <T>(
    handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<T> | T
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(handler(req as AuthenticatedRequest, res, next)).catch(next);
    };
};

export async function authenticationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            throw new UnauthorizedError()
        }

        let payload: SessionPayload;

        try {
            const verifiedData = await jwtVerify<SessionPayload>(token, getJwtSecret, {
                issuer: 'https://yipshare.oelohey.dev',
                audience: 'https://yipshare.oelohey.dev',
            });
            payload = verifiedData.payload;
        } catch (err) {
            throw new UnauthorizedError()
        }

        if (typeof payload.sessionToken !== 'string') {
            console.log(payload.sessionToken);
            throw new UnauthorizedError()
        }


        const hash = createHash('sha256').update(payload.sessionToken).digest('hex');
        const [sessionObject] = await db.select().from(sessions).where(eq(sessions.tokenHash, hash)).limit(1);

        if (!sessionObject) {
            throw new UnauthorizedError()
        }

        if (sessionObject.expiresAt && sessionObject.expiresAt < new Date()) {
            throw new UnauthorizedError()
        }

        req.session =  sessionObject;
        next();
    } catch (internalError) {
        next(internalError);
    }
}