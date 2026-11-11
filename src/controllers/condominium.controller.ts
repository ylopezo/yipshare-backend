import {type Request, type Response, type NextFunction} from "express";
import {getCondominiums, getCondominiumById} from "@/services/condominium.service.ts";
import {CondominiumIdParams} from "@/schema/condominium.schema.ts";

export const getListOfCondominiums = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const condominiums = await getCondominiums();
        return res.status(200).json(condominiums);
    } catch (error) {
        next(error);
    }
}
export const getCondominium = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {id} = CondominiumIdParams.parse(req.params);
        const condominium = await getCondominiumById(id);
        return res.status(200).json(condominium);
    } catch (error) {
        next(error);
    }
}