import type {Response, NextFunction} from "express";
import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import {getNotifications, markNotificationsAsRead} from "@/services/notification.service.ts";

export const getMyNotifications = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json(await getNotifications(req.session.userId));
    } catch (error) {
        next(error);
    }
}

export const readMyNotifications = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        await markNotificationsAsRead(req.session.userId);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}
