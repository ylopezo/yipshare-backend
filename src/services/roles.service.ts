import { db } from "@/db/db.ts";
import { permissions, rolePermissions, roles } from "@/db/schema.ts";
import { and, eq, inArray, ne } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/utils/errors.ts";

export const getRoleService = async (id: string) => {
    const [role] = await db.select().from(roles).where(eq(roles.roleId, id)).limit(1);
    if (!role) throw new NotFoundError("Role not found");
    return role;
};

export const getRoleByNameService = async (name: string) => {
    const [role] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    if (!role) throw new NotFoundError("Role not found");
    return role;
};

export const getRolesService = async () => {
    return await db.select().from(roles);
};

export const createRoleService = async (name: string) => {
    const [conflictRole] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    if (conflictRole) throw new ConflictError("Role with that name already exists");
    const [role] = await db.insert(roles).values({ name: name }).returning();
    if (!role) throw new NotFoundError("Role not found");
    return role;
};

export const updateRoleService = async (id: string, name: string) => {
    const [conflictRole] = await db
        .select()
        .from(roles)
        .where(and(eq(roles.name, name), ne(roles.roleId, id)))
        .limit(1);
    if (conflictRole) throw new ConflictError("Role with that name already exists");
    const [role] = await db.update(roles).set({ name: name }).where(eq(roles.roleId, id)).returning();
    if (!role) throw new NotFoundError("Role not found");
    return role;
};

export const deleteRoleService = async (id: string) => {
    const [role] = await db.delete(roles).where(eq(roles.roleId, id));
    if (!role) throw new NotFoundError("Role not found");
};

export const getRolePermissionsService = async (id: string) => {
    const perms = await db
        .select({ name: permissions.name })
        .from(rolePermissions)
        .innerJoin(permissions, eq(permissions.permissionId, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, id));
    if (perms.length <= 0) throw new NotFoundError("Role not found");
    return { permissions: perms.map((perm) => perm.name) };
};

export const updateRolePermissionsService = async (id: string, newPermissions: string[]) => {
    const perms = new Set((await getRolePermissionsService(id)).permissions);
    const newPermSet = new Set(newPermissions);
    const extra = perms.difference(newPermSet);
    const missing = newPermSet.difference(perms);

    const [extraPermissionIds, missingPermissionIds] = await Promise.all([
        db
            .select({ id: permissions.permissionId })
            .from(permissions)
            .where(inArray(permissions.name, Array.from(extra))),
        db
            .select({ id: permissions.permissionId })
            .from(permissions)
            .where(inArray(permissions.name, Array.from(missing))),
    ]);

    await db.insert(rolePermissions).values(
        Array.from(missingPermissionIds, (val) => {
            return { allowed: true, roleId: id, permissionId: val.id };
        }),
    );
    await db.delete(rolePermissions).where(
        inArray(
            permissions.permissionId,
            Array.from(extraPermissionIds, (val) => val.id),
        ),
    );

    return db.select().from(rolePermissions).where(eq(rolePermissions.roleId, id));
};
