import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz} from "@/middlewares/authorization.middleware.ts";
import {getMyNotifications, readMyNotifications} from "@/controllers/notification.controller.ts";

const router = Router();

router.get('/', authenticationHandler, withAuthz(getMyNotifications));
router.post('/read', authenticationHandler, withAuthz(readMyNotifications));

export default router;
