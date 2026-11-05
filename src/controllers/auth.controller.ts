import {type Request,type Response,type NextFunction} from 'express';
import {LoginRequest} from "../schema/auth.schema.ts";

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loginBody = LoginRequest.parse(req.body);

    } catch (e) {
        next(e)
    }
}