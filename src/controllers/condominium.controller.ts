import {type Request, type Response, type NextFunction} from "express";
import {getCondominiums, getCondominiumById, getUnitsByCondominium, createCondominium, updateCondominium, deleteCondominium, approveCondominium, getUnitById, createUnit, updateUnit, deleteUnit} from "@/services/condominium.service.ts";
import {CondominiumIdParams, CondominiumUnitParams, CreateCondominiumRequest, CreateCondominiumUnitRequest, UpdateCondominiumRequest, UpdateCondominiumUnitRequest} from "@/schema/condominium.schema.ts";
import {UnauthorizedError} from "@/utils/errors";
import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";

export const getListOfCondominiums = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const condominiums = await getCondominiums();
        return res.status(200).json(condominiums);
    } catch (error) {
        next(error);
    }
}
export const getCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try{
        const {id} = CondominiumIdParams.parse(req.params);
        const condominium = await getCondominiumById(id);
        return res.status(200).json(condominium);
    } catch (error) {
        next(error);
    }
}
export const getCondominiumUnits = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try{
        const {id} = CondominiumIdParams.parse(req.params);
        const units = await getUnitsByCondominium(id);
        return res.status(200).json(units);
    } catch (error) {
        next(error);
    }
}

export const postCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
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

export const patchCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.userId;
        if (!userId) throw new UnauthorizedError("User not authenticated");
        const {id} = CondominiumIdParams.parse(req.params);
        const data = UpdateCondominiumRequest.parse(req.body);
        const condominium = await updateCondominium(id, data, userId);
        return res.status(200).json(condominium);
    } catch (error) {
        next(error);
    }
}

export const removeCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.userId;
        if (!userId) throw new UnauthorizedError("User not authenticated");
        const {id} = CondominiumIdParams.parse(req.params);
        await deleteCondominium(id, userId);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const approveCondominiumHandler = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.userId;
        if (!userId) throw new UnauthorizedError("User not authenticated");
        const {id} = CondominiumIdParams.parse(req.params);
        const condominium = await approveCondominium(id, userId);
        return res.status(200).json(condominium);
    } catch (error) {
        next(error);
    }
}

export const getCondominiumUnit = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id, unitId} = CondominiumUnitParams.parse(req.params);
        const unit = await getUnitById(id, unitId);
        return res.status(200).json(unit);
    } catch (error) {
        next(error);
    }
}

export const postCondominiumUnit = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.userId;
        if (!userId) throw new UnauthorizedError("User not authenticated");
        const {id} = CondominiumIdParams.parse(req.params);
        const data = CreateCondominiumUnitRequest.parse(req.body);
        const unit = await createUnit(id, data, userId);
        return res.status(201).json(unit);
    } catch (error) {
        next(error);
    }
}

export const patchCondominiumUnit = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.userId;
        if (!userId) throw new UnauthorizedError("User not authenticated");
        const {id, unitId} = CondominiumUnitParams.parse(req.params);
        const data = UpdateCondominiumUnitRequest.parse(req.body);
        const unit = await updateUnit(id, unitId, data, userId);
        return res.status(200).json(unit);
    } catch (error) {
        next(error);
    }
}

export const removeCondominiumUnit = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.userId;
        if (!userId) throw new UnauthorizedError("User not authenticated");
        const {id, unitId} = CondominiumUnitParams.parse(req.params);
        await deleteUnit(id, unitId, userId);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}
