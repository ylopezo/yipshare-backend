import {db} from "@/db/db.ts";
import {condominiums, condominiumUnits} from "@/db/schema.ts";
import {eq} from "drizzle-orm";
import {randomBytes} from "node:crypto";
import {NotFoundError} from "@/utils/errors";
import * as z from "zod";
import {CreateCondominiumRequest} from "@/schema/condominium.schema.ts";

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

type CreateCondominiumData = z.infer<typeof CreateCondominiumRequest>;

export const createCondominium = async (data: CreateCondominiumData, userId: string) => {
    const [condominium] = await db
        .insert(condominiums)
        .values({
            ...data,
            userId,
            shortCode: randomBytes(3).toString('hex').toUpperCase(),
            digitalState: 'pending',
        })
        .returning();

    return condominium;
}
