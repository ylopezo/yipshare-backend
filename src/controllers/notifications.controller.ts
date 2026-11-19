import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import type {NextFunction, Response} from "express";
import {
    createNotificationService,
    deleteNotificationService,
    getNotificationsService, markNotificationAsRead
} from "@/services/notifications.service.ts";
import {getNotificationService} from "@/services/notifications.service.ts";
import {NotificationCreate, NotificationFetchIdParams} from "@/schema/notifications.schema.ts";
import {UserIdParams} from "@/schema/users.schema.ts";

export const getNotifications = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = UserIdParams.parse(req.params);
        return res.status(200).json(await getNotificationsService(params.id));
    } catch (error) {
        next(error);
    }
}

export const getNotification = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = NotificationFetchIdParams.parse(req.params);
        return res.status(200).json(await getNotificationService(params.id));
    } catch (error) {
        next(error);
    }
}
export const createNotification = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const body = NotificationCreate.parse(req.body);
        return res.status(200).json(await createNotificationService(body.userId, body.header, body.body, body.action));
    } catch (error) {
        next(error);
    }
}

export const deleteNotification = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = NotificationFetchIdParams.parse(req.params);
        await deleteNotificationService(params.id)
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const readNotification = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = NotificationFetchIdParams.parse(req.params);
        await markNotificationAsRead(params.id);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}
