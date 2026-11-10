import {type Request,type Response,type NextFunction} from 'express';
import {LoginRequest} from "../schema/auth.schema.ts";
import {loginService} from "@/services/auth.service.ts";

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