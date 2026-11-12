import {db} from "@/db/db.ts";
import {roles} from "@/db/schema.ts";
import {eq} from "drizzle-orm";

const getRoleId = async (name: string) => {
    const [role] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    if (!role) throw new Error(`Role '${name}' missing, run bun run db:seed`);
    return role.roleId;
}