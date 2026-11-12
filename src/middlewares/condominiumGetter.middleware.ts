import type {NextFunction, Request, Response} from "express";
import * as z from "zod";

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
// Reads the condominium id from the URL so withPermissions can resolve condominium-scoped roles.
export const getIdFromParams = (paramName: string) =>
    (req: Request, res: Response, next: NextFunction) => {
        const value = req.params[paramName];
        // Invalid ids fall back to global permissions; the controller's zod parse returns 400.
        req.condominiumId = z.uuid().safeParse(value).success ? value as string : null;
        next();
    };
