import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {
    createNotification,
    deleteNotification,
    getNotification,
    getNotifications, readNotification
} from "@/controllers/notifications.controller.ts";
import {deleteNotificationSelf, getNotificationSelf, getNotificationsSelf, readNotificationSelf} from "@/controllers/users.controller.ts";

const router = Router();


router.get('/me', authenticationHandler, withPermissions('users:read.notifications'), withAuthz(getNotificationsSelf));
router.get('/me/:id', authenticationHandler, withPermissions('users:read.notifications'), withAuthz(getNotificationSelf));
router.delete('/me/:id', authenticationHandler, withPermissions('users:delete.notifications'), withAuthz(deleteNotificationSelf));
router.post('/me/:id/read', authenticationHandler, withPermissions('users:update.notifications.markRead'), withAuthz(readNotificationSelf));

router.get('/', authenticationHandler, withPermissions('notifications:read'), withAuthz(getNotifications));
router.get('/:id', authenticationHandler, withPermissions('notifications:read'), withAuthz(getNotification));
router.post('/', authenticationHandler, withPermissions('notifications:create') ,withAuthz(createNotification));
router.delete('/:id', authenticationHandler, withPermissions('notifications:delete') ,withAuthz(deleteNotification));
router.post('/:id/read', authenticationHandler, withPermissions('notifications:update.markRead'), withAuthz(readNotification))

export default router;

