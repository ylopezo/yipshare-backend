import type { AuthorizedRequest } from "@/middlewares/authorization.middleware.ts";
import {
    createRoleService,
    deleteRoleService,
    getRoleByNameService,
    getRoleService,
    getRolesService,
    updateRoleService,
} from "@/services/roles.service.ts";
import { RoleCreateParams, RoleFetchByNameParams, RoleFetchIdParams } from "@/schema/roles.schema.ts";
import type { NextFunction, Response } from "express";

export const getAllRoles = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const roles = await getRolesService();
        return res.status(200).json(roles);
    } catch (e) {
        next(e);
    }
};

export const getRole = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = RoleFetchIdParams.parse(req.params);
        const role = await getRoleService(params.id);
        return res.status(200).json(role);
    } catch (e) {
        next(e);
    }
};

export const getRoleByName = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = RoleFetchByNameParams.parse(req.params);
        const role = await getRoleByNameService(params.name);
        return res.status(200).json(role);
    } catch (e) {
        next(e);
    }
};

export const createRole = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const body = RoleCreateParams.parse(req.body);
        const role = await createRoleService(body.name);
        return res.status(201).json(role);
    } catch (e) {
        next(e);
    }
};

export const updateRole = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = RoleFetchIdParams.parse(req.params);
        const body = RoleCreateParams.parse(req.body);
        const role = await updateRoleService(params.id, body.name);
        return res.status(200).json(role);
    } catch (e) {
        next(e);
    }
};

export const deleteRole = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const params = RoleFetchIdParams.parse(req.params);
        await deleteRoleService(params.id);
        return res.status(204).end();
    } catch (e) {
        next(e);
    }
};
