import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import {type NextFunction, request, type Response} from "express";
import {
    createUserService,
    deleteUserService,
    getUserService, getUsersService,
    modifyUserService
} from "@/services/user.service.ts";
import {ModifyUserRequest, UserIdParams} from "@/schema/users.schema.ts";
import {RegisterRequest} from "@/schema/auth.schema.ts";

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
        return res.status(204);
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
            requestBody.password);
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const deleteUserSelf = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        await deleteUserService(req.session.userId);
        return res.status(204);
    } catch (error) {
        next(error);
    }
}