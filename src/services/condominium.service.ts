import {db} from "@/db/db.ts";
import {condominiums} from "@/db/schema.ts";

export const getCondominiums = async () => {
    const result = await db.select().from(condominiums);
    return result;
}