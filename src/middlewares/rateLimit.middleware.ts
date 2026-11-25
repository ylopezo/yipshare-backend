import type { Request, RequestHandler } from "express";
import { TooManyRequestsError } from "@/utils/errors.js";

type Options = {
    windowMs: number;
    max: number;
    key: (req: Request) => string;
};

export const rateLimit = ({ windowMs, max, key }: Options): RequestHandler => {
    const hits = new Map<string, { count: number; resetAt: number }>();

    return (req, res, next) => {
        const now = Date.now();

        if (hits.size > 10_000) {
            for (const [id, hit] of hits) if (hit.resetAt <= now) hits.delete(id);
        }

        const id = key(req);
        const hit = hits.get(id);

        if (!hit || hit.resetAt <= now) {
            hits.set(id, { count: 1, resetAt: now + windowMs });
            return next();
        }

        hit.count++;
        if (hit.count > max) {
            res.set("Retry-After", String(Math.ceil((hit.resetAt - now) / 1000)));
            return next(new TooManyRequestsError());
        }

        next();
    };
};
