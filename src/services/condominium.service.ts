import {db} from "@/db/db.ts";
import {condominiums, condominiumUnits} from "@/db/schema.ts";
import {eq} from "drizzle-orm";
import {NotFoundError} from "@/utils/errors";
import {getCondominium} from "@/controllers/condominium.controller.ts";

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

export const getUnitsByCondominium = async (id: string) => {
    await getCondominiumById(id);
    return await db
        .select()
        .from(condominiumUnits)
        .where(eq(condominiumUnits.condominiumId, id));
}