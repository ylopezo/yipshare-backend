import {db} from "@/db/db.ts";
import {roles, userRoles} from "@/db/schema.ts";
import {and, eq} from "drizzle-orm";

export const isGlobalAdmin = async (userId: string) => {
    const [row] = await db
        .select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
        .where(and(
            eq(userRoles.userId, userId),
            eq(userRoles.isGlobal, true),
            eq(roles.name, 'global_admin'),
        ))
        .limit(1);

    return !!row;
}
