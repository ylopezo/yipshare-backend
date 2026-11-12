import {Router} from "express";
import {login, logout, me, register, testPerm} from "@/controllers/auth.controller.ts";
import {authenticationHandler, withAuth} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
const router = Router();

router.post("/login", login);
router.post('/register', register);
router.post("/logout", authenticationHandler, withAuth(logout));
router.get("/me", authenticationHandler, withAuth(me));
router.post("/test", authenticationHandler, withPermissions('admin:test'), withAuthz(testPerm));

export default router;