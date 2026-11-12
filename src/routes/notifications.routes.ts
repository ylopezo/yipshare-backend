import {Router} from "express";
import {authenticationHandler, withAuth} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {
    createNotification,
    deleteNotification,
    getNotification,
    getNotifications
} from "@/controllers/notifications.controller.ts";

const router = Router();

router.get('/', authenticationHandler, withPermissions('notifications:read'), withAuthz(getNotifications));
router.get('/:id', authenticationHandler, withPermissions('notifications:read'), withAuthz(getNotification));
router.post('/', authenticationHandler, withPermissions('notifications:create') ,withAuthz(createNotification));
router.delete('/:id', authenticationHandler, withPermissions('notifications:delete') ,withAuthz(deleteNotification));

export default router;

