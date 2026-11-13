import {type Request, type Response, type NextFunction} from "express";
import {getCondominiums, getMyCondominiums, getCondominiumById, rejectCondominium, getUnitsByCondominium, createCondominium, updateCondominium, deleteCondominium, approveCondominium, getUnitById, createUnit, updateUnit, deleteUnit, requestJoin, getMembers, getPendingMembers, approveMember, removeMember} from "@/services/condominiums.service.ts";
import {CondominiumIdParams, CondominiumUnitParams, CreateCondominiumRequest, CreateCondominiumUnitRequest, UpdateCondominiumRequest, UpdateCondominiumUnitRequest, JoinCondominiumRequest, MemberParams, ApproveMemberRequest} from "@/schema/condominiums.schema.ts";
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
        const userId = req.session.userId;
        const data = CreateCondominiumRequest.parse(req.body);
        const condominium = await createCondominium(data, userId);
        return res.status(201).json(condominium);
    } catch (error) {
        next(error);
    }
}

export const patchCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = CondominiumIdParams.parse(req.params);
        const data = UpdateCondominiumRequest.parse(req.body);
        const condominium = await updateCondominium(id, data);
        return res.status(200).json(condominium);
    } catch (error) {
        next(error);
    }
}

export const removeCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = CondominiumIdParams.parse(req.params);
        await deleteCondominium(id);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const approveCondominiumHandler = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.session.userId;
        const {id} = CondominiumIdParams.parse(req.params);
        const condominium = await approveCondominium(id, userId);
        return res.status(200).json(condominium);
    } catch (error) {
        next(error);
    }
}

export const rejectCondominiumHandler = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = CondominiumIdParams.parse(req.params);
        await rejectCondominium(id);
        return res.status(204).end();
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
        const {id} = CondominiumIdParams.parse(req.params);
        const data = CreateCondominiumUnitRequest.parse(req.body);
        const unit = await createUnit(id, data);
        return res.status(201).json(unit);
    } catch (error) {
        next(error);
    }
}

export const patchCondominiumUnit = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id, unitId} = CondominiumUnitParams.parse(req.params);
        const data = UpdateCondominiumUnitRequest.parse(req.body);
        const unit = await updateUnit(id, unitId, data);
        return res.status(200).json(unit);
    } catch (error) {
        next(error);
    }
}

export const removeCondominiumUnit = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id, unitId} = CondominiumUnitParams.parse(req.params);
        await deleteUnit(id, unitId);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const postJoinCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = JoinCondominiumRequest.parse(req.body);
        const request = await requestJoin(req.session.userId, data);
        return res.status(201).json(request);
    } catch (error) {
        next(error);
    }
}

export const getCondominiumMembers = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = CondominiumIdParams.parse(req.params);
        const members = await getMembers(id);
        return res.status(200).json(members);
    } catch (error) {
        next(error);
    }
}

export const getCondominiumPendingMembers = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = CondominiumIdParams.parse(req.params);
        const pending = await getPendingMembers(id);
        return res.status(200).json(pending);
    } catch (error) {
        next(error);
    }
}

export const approveCondominiumMember = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id, userId} = MemberParams.parse(req.params);
        const {unitId} = ApproveMemberRequest.parse(req.body ?? {});
        await approveMember(id, userId, unitId);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const removeCondominiumMember = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id, userId} = MemberParams.parse(req.params);
        await removeMember(id, userId, req.session.userId);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const getMyCondominiumsHandler = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json(await getMyCondominiums(req.session.userId));
    } catch (error) {
        next(error);
    }
}
