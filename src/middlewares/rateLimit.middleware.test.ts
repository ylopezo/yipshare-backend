import { expect, test } from "bun:test";
import { rateLimit } from "./rateLimit.middleware.ts";

const run = (mw: any, req: any) => {
    let error: any = null;
    const res = { set() {} };
    mw(req, res, (e: any) => (error = e ?? null));
    return error;
};

test("allows up to max, then blocks with 429, per key", () => {
    const mw = rateLimit({ windowMs: 60_000, max: 3, key: (r) => r.body.username });

    for (let i = 0; i < 3; i++) expect(run(mw, { body: { username: "ana" } })).toBeNull();

    const blocked = run(mw, { body: { username: "ana" } });
    expect(blocked?.statusCode).toBe(429);

    expect(run(mw, { body: { username: "beto" } })).toBeNull();
});

test("resets after the window passes", () => {
    let now = 1_000_000;
    const realNow = Date.now;
    Date.now = () => now;
    try {
        const mw = rateLimit({ windowMs: 1000, max: 1, key: () => "k" });
        expect(run(mw, { body: {} })).toBeNull();
        expect(run(mw, { body: {} })?.statusCode).toBe(429);
        now += 1001;
        expect(run(mw, { body: {} })).toBeNull();
    } finally {
        Date.now = realNow;
    }
});
