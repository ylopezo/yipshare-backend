import {Router} from "express";
import {login, logout, me, register} from "@/controllers/auth.controller.ts";
import {authenticationHandler, withAuth} from "@/middlewares/authentication.middleware.ts";
const router = Router();

router.post("/login", login);
router.post('/register', register);
router.post("/logout", authenticationHandler, withAuth(logout));
router.get("/me", authenticationHandler, withAuth(me));

export default router;