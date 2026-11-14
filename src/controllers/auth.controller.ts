import {type Request,type Response,type NextFunction} from 'express';
import {LoginRequest, RegisterRequest} from "../schema/auth.schema.ts";
import {loginService, logoutService, profileService, registerService} from "@/services/auth.service.ts";
import type {AuthenticatedRequest} from "@/middlewares/authentication.middleware.ts";
import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loginBody = LoginRequest.parse(req.body);

        const token = await loginService(loginBody.username, loginBody.password);

        return res.status(200).json({
            token: token,
            token_type: 'Bearer',
        });
    } catch (e) {
        next(e)
    }
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const registerBody = RegisterRequest.parse(req.body);

        const token = await registerService(registerBody.name,
            registerBody.paternalSurname,
            registerBody.maternalSurname,
            registerBody.email,
            registerBody.phoneNumber,
            registerBody.username,
            registerBody.password);

        return res.status(201).json({
            token: token,
            token_type: 'Bearer',
        })
    } catch (e) {
        next(e)
    }
}

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        await logoutService(req.session.tokenHash);
        res.status(204).end();
    } catch (e) {
        next(e)
    }
}

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        res.status(200).json(await profileService(req.session.userId));
    } catch (e) {
        next(e)
    }
}
