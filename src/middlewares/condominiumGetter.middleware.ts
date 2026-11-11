import type {NextFunction, Request, Response} from "express";

export const getIdFromBody = (fieldName: string) => {
    return async function getCondominiumIdFromRequestBodyHandler(req: Request,
                                                                 res: Response,
                                                                 next: NextFunction): Promise<void> {
        const value = req.body.fields[fieldName];
        if (!value || typeof value !== 'string') {
            req.condominiumId = null;
            return;
        }
        req.condominiumId = value;
        next();
    }
}