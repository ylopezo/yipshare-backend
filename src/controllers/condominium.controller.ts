import {type Request, type Response, type NextFunction} from "express";
import {getCondominiums, getCondominiumById, getUnitsByCondominium, createCondominium} from "@/services/condominium.service.ts";
import {CondominiumIdParams, CreateCondominiumRequest} from "@/schema/condominium.schema.ts";
import {UnauthorizedError} from "@/utils/errors";

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
export const getCondominiumUnits = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {id} = CondominiumIdParams.parse(req.params);
        const units = await getUnitsByCondominium(id);
        return res.status(200).json(units);
    } catch (error) {
        next(error);
    }
}

export const postCondominium = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.userId;
        if (!userId) throw new UnauthorizedError("User not authenticated");
        const data = CreateCondominiumRequest.parse(req.body);
        const condominium = await createCondominium(data, userId);
        return res.status(201).json(condominium);
    } catch (error) {
        next(error);
    }
}