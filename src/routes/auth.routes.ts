import {Router} from "express";
import {login, logout, me, register} from "@/controllers/auth.controller.ts";
import {authenticationHandler, withAuth} from "@/middlewares/authentication.middleware.ts";
import {rateLimit} from "@/middlewares/rateLimit.middleware.ts";
const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    key: (req) => `login:${(req.body?.username ?? req.ip ?? "").toString().toLowerCase()}`,
});

router.post("/login", loginLimiter, login);
router.post('/register', register);
router.post("/logout", authenticationHandler, withAuth(logout));
router.get("/me", authenticationHandler, withAuth(me));

export default router;