import {db} from "@/db/db.ts";
import {condominiums} from "@/db/schema.ts";
import {eq} from "drizzle-orm";
import {NotFoundError} from "@/utils/errors";

export const getCondominiums = async () => {
    return db.select().from(condominiums);
}

export const getCondominiumById = async (id: string) => {
    const [condominium] = await db
        .select()
        .from(condominiums)
        .where(eq(condominiums.condominiumId, id))
        .limit(1);

    if (!condominium) throw new NotFoundError("Condominium not found");

    return condominium;
}