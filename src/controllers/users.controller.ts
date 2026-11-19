import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import {type NextFunction, request, type Response} from "express";
import {
    createUserService,
    deleteUserService,
    getUserProfileService, getUserService, getUsersService,
    modifyUserService, uploadPFPService
} from "@/services/users.service.ts";
import {ModifyUserRequest, UserIdParams} from "@/schema/users.schema.ts";
import {RegisterRequest} from "@/schema/auth.schema.ts";
import {
    getNotificationServiceUserFiltered,
    deleteNotificationSelfService, getNotificationsService, markNotificationAsRead, markNotificationAsReadSelf,
} from "@/services/notifications.service.ts";
import {NotificationFetchIdParams} from "@/schema/notifications.schema.ts";
import type {PFPImgHandles} from "@/routes/users.routes.ts";

export const getListOfUsers = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const users = await getUsersService();
        return res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}

export const getUser = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const requestBody = UserIdParams.parse(req.params);
        const user = await getUserService(requestBody.id);
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const modifyUser = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = UserIdParams.parse(req.params);
        const requestBody = ModifyUserRequest.parse(req.body);
        const user = await modifyUserService(params.id,
            requestBody.name,
            requestBody.paternalSurname,
            requestBody.maternalSurname,
            requestBody.email,
            requestBody.phoneNumber,
            requestBody.username,
            requestBody.password);
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const createUser = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const requestBody = RegisterRequest.parse(req.body);
        const user = await createUserService(
            requestBody.name,
            requestBody.paternalSurname,
            requestBody.maternalSurname,
            requestBody.email,
            requestBody.phoneNumber,
            requestBody.username,
            requestBody.password);
        return res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

export const deleteUser = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const requestBody = UserIdParams.parse(req.params);
        await deleteUserService(requestBody.id);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const getUserSelf = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const user = await getUserService(req.session.userId);
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const modifyUserSelf = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const requestBody = ModifyUserRequest.parse(req.body);
        const user = await modifyUserService(req.session.userId,
            requestBody.name,
            requestBody.paternalSurname,
            requestBody.maternalSurname,
            requestBody.email,
            requestBody.phoneNumber,
            requestBody.username,
            requestBody.password,
            requestBody.currentPassword);
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const getUserProfile = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = UserIdParams.parse(req.params);
        return res.status(200).json(await getUserProfileService(id));
    } catch (error) {
        next(error);
    }
}

export const deleteUserSelf = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        await deleteUserService(req.session.userId);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const getNotificationsSelf = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json(await getNotificationsService(req.session.userId));
    } catch (error) {
        next(error);
    }
}

export const getNotificationSelf = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = NotificationFetchIdParams.parse(req.params);
        return res.status(200).json(await getNotificationServiceUserFiltered(req.session.userId, params.id));
    } catch (error) {
        next(error);
    }
}

export const readNotificationSelf = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = NotificationFetchIdParams.parse(req.params);
        await markNotificationAsReadSelf(req.session.userId, params.id);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}


export const deleteNotificationSelf = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = NotificationFetchIdParams.parse(req.params);
        await deleteNotificationSelfService(req.session.userId, params.id);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const uploadPFP = async (req: AuthorizedRequest<{fileHandles: PFPImgHandles}>, res: Response, next: NextFunction) => {
    try {
        const {
            image: [image]
        } = req.fileHandles;
        await uploadPFPService(req.session.userId, image!.url)
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}