import {type Request, type Response, type NextFunction} from "express";
import {getCondominiums} from "@/services/condominium.service.ts";

export const getListOfCondominiums = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const condominiums = await getCondominiums();
        return res.status(200).json(condominiums);
    } catch (error) {
        next(error);
    }
}