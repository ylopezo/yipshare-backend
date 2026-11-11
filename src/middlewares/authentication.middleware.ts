import type {Request, Response, NextFunction, RequestHandler} from 'express';
import {type JWTPayload, jwtVerify} from "jose";
import {getJwtSecret} from "@/config/jwt.ts";
import {db} from "@/db/db.ts";
import {sessions} from "@/db/schema.ts";
import {eq} from "drizzle-orm";
import {createHash} from "node:crypto";

export interface UserSession {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface AuthenticatedRequest extends Request {
    session: UserSession;
}
interface SessionPayload extends JWTPayload {
    sessionToken: string;
}

type AuthenticatedHandler = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => Promise<any> | any;

export const withAuth = (handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>): RequestHandler => {
    return (req, res, next) => handler(req as AuthenticatedRequest, res, next);
};

export async function authenticationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        res.status(401).send('Access Denied. No token provided.');
        return;
    }

    let payload: SessionPayload;

    try {
        const verifiedData = await jwtVerify<SessionPayload>(token, getJwtSecret, {
            issuer: 'https://yipshare.oelohey.dev',
            audience: 'https://yipshare.oelohey.dev',
        });
        payload = verifiedData.payload;
    } catch (err) {
        res.status(403).json({message: "Malformed or expired token."});
        return;
    }

    if (typeof payload.sessionToken !== 'string') {
        console.log(payload.sessionToken);
        res.status(401).json({message: 'Malformed token payload.'});
        return;
    }

    try {
        const hash = createHash('sha256').update(payload.sessionToken).digest('hex');
        const [sessionObject] = await db.select().from(sessions).where(eq(sessions.tokenHash, hash)).limit(1);

        if (!sessionObject) {
            res.status(401).json({message: 'Session token not found or revoked.'});
            return;
        }

        if (sessionObject.expiresAt && sessionObject.expiresAt < new Date()) {
            res.status(401).json({message: 'Session token expired.'});
            return;
        }

        req.session =  sessionObject;
        next();
    } catch (internalError) {
        next(internalError);
    }
}