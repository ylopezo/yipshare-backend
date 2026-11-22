import type {Response, NextFunction, RequestHandler} from "express";
import type {Permission} from "@/types/permissions.ts";
import type {AuthenticatedRequest} from "@/middlewares/authentication.middleware.ts";
import {db} from "@/db/db.ts";
import {permissionOverrides, permissions, rolePermissions, userRoles} from "@/db/schema.ts";
import {and, eq, isNull, or} from "drizzle-orm";
import {ForbiddenError, UnauthorizedError} from "@/utils/errors.ts";

export type AuthorizedRequest<TExtra = {}> = AuthenticatedRequest &{
    permissions: Set<string>;
} & TExtra;

export const withAuthz = <TExtra = {}, T = any>(
    handler: (req: AuthorizedRequest<TExtra>, res: Response, next: NextFunction) => Promise<T> | T
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(handler(req as AuthorizedRequest<TExtra>, res, next)).catch(next);
    };
};

export const withPermissions = (...requiredPermissions: [Permission, ...Permission[]]) : RequestHandler => {
    const permissionSet = new Set(requiredPermissions);
    return async (req, res, next) => {
        try {
            const userId = req.session?.userId;

            if (!userId) {
                throw new UnauthorizedError();
            }

            const condominiumId = req.condominiumId ?? null;

            const resolvedUserPermissions = await resolveUserPermissions(userId, condominiumId);

            if (resolvedUserPermissions.isSupersetOf(permissionSet)) {
                req.permissions = resolvedUserPermissions;
                next()
            } else {
                throw new ForbiddenError();
            }
        } catch (error) {
            next(error);
        }
    }
}

type PermissionRule = {
    permission: string;
    condominiumId: string | null;
    allowed: boolean;
};

const resolveUserPermissions = async (userId: string, condominiumId: string | null) => {

    const roleScope = condominiumId !== null
        ? or(isNull(userRoles.condominiumId), eq(userRoles.condominiumId, condominiumId))
        : isNull(userRoles.condominiumId);

    const overrideScope = condominiumId !== null
        ? or(isNull(permissionOverrides.condominiumId), eq(permissionOverrides.condominiumId, condominiumId))
        : isNull(permissionOverrides.condominiumId);

    const [rolePerms, overrides] = await Promise.all([
        db
            .select({
                permission: permissions.name,
                condominiumId: userRoles.condominiumId,
                allowed: rolePermissions.allowed
            })
            .from(userRoles)
            .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.permissionId))
            .where(
                and(
                    eq(userRoles.userId, userId),
                    roleScope
                )
            ),
        db
            .select({
                permission: permissions.name,
                condominiumId: permissionOverrides.condominiumId,
                allowed: permissionOverrides.allowed,
            })
            .from(permissionOverrides)
            .innerJoin(permissions, eq(permissionOverrides.permissionId, permissions.permissionId))
            .where(
                and(
                    eq(permissionOverrides.userId, userId),
                    overrideScope
                )
            ),
    ]);

    const effective = new Set<string>();

    const applyRuleLayer = (rules: PermissionRule[]) => {
        rules.sort((a, b) => Number(b.allowed) - Number(a.allowed));
        for (const rule of rules) {
            if (rule.allowed) effective.add(rule.permission);
            else effective.delete(rule.permission);
        }
    };

    applyRuleLayer(rolePerms.filter((r) => r.condominiumId === null))
    applyRuleLayer(rolePerms.filter((r) => r.condominiumId !== null))
    applyRuleLayer(overrides.filter((r) => r.condominiumId === null))
    applyRuleLayer(overrides.filter((r) => r.condominiumId !== null))

    return effective;
}