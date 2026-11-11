import {db} from "@/db/db.ts";
import {condominiums, condominiumUnits} from "@/db/schema.ts";
import {and, eq, ne} from "drizzle-orm";
import {randomBytes} from "node:crypto";
import {ConflictError, ForbiddenError, NotFoundError} from "@/utils/errors";
import {isGlobalAdmin} from "@/services/role.service.ts";
import * as z from "zod";
import {CreateCondominiumRequest, CreateCondominiumUnitRequest, UpdateCondominiumRequest} from "@/schema/condominium.schema.ts";

export const getCondominiums = async () => {
    return db.select().from(condominiums).where(ne(condominiums.digitalState, 'deleted'));
}

export const getCondominiumById = async (id: string) => {
    const [condominium] = await db
        .select()
        .from(condominiums)
        .where(eq(condominiums.condominiumId, id))
        .limit(1);

    if (!condominium || condominium.digitalState === 'deleted') throw new NotFoundError("Condominium not found");

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

type UpdateCondominiumData = z.infer<typeof UpdateCondominiumRequest>;

export const updateCondominium = async (id: string, data: UpdateCondominiumData, userId: string) => {
    if (!(await isGlobalAdmin(userId))) throw new ForbiddenError("Only global admins can update condominiums");
    await getCondominiumById(id);

    const [condominium] = await db
        .update(condominiums)
        .set(data)
        .where(eq(condominiums.condominiumId, id))
        .returning();

    return condominium;
}

export const deleteCondominium = async (id: string, userId: string) => {
    if (!(await isGlobalAdmin(userId))) throw new ForbiddenError("Only global admins can delete condominiums");
    await getCondominiumById(id);

    await db
        .update(condominiums)
        .set({digitalState: 'deleted'})
        .where(eq(condominiums.condominiumId, id));
}

export const approveCondominium = async (id: string, userId: string) => {
    if (!(await isGlobalAdmin(userId))) throw new ForbiddenError("Only global admins can approve condominiums");
    const existing = await getCondominiumById(id);
    if (existing.digitalState !== 'pending') throw new ConflictError("Condominium is not pending");

    const [condominium] = await db
        .update(condominiums)
        .set({digitalState: 'approved', approvedAt: new Date(), approvedBy: userId})
        .where(eq(condominiums.condominiumId, id))
        .returning();

    return condominium;
}

export const getUnitById = async (condominiumId: string, unitId: string) => {
    await getCondominiumById(condominiumId);
    const [unit] = await db
        .select()
        .from(condominiumUnits)
        .where(and(eq(condominiumUnits.condominiumId, condominiumId), eq(condominiumUnits.condominiumUnitId, unitId)))
        .limit(1);

    if (!unit) throw new NotFoundError("Unit not found");

    return unit;
}

type CondominiumUnitData = z.infer<typeof CreateCondominiumUnitRequest>;

export const createUnit = async (condominiumId: string, data: CondominiumUnitData, userId: string) => {
    if (!(await isGlobalAdmin(userId))) throw new ForbiddenError("Only global admins can create units");
    await getCondominiumById(condominiumId);

    const [unit] = await db
        .insert(condominiumUnits)
        .values({...data, condominiumId})
        .returning();

    return unit;
}

export const updateUnit = async (condominiumId: string, unitId: string, data: CondominiumUnitData, userId: string) => {
    if (!(await isGlobalAdmin(userId))) throw new ForbiddenError("Only global admins can update units");
    await getUnitById(condominiumId, unitId);

    const [unit] = await db
        .update(condominiumUnits)
        .set(data)
        .where(eq(condominiumUnits.condominiumUnitId, unitId))
        .returning();

    return unit;
}

export const deleteUnit = async (condominiumId: string, unitId: string, userId: string) => {
    if (!(await isGlobalAdmin(userId))) throw new ForbiddenError("Only global admins can delete units");
    await getUnitById(condominiumId, unitId);

    try {
        await db.delete(condominiumUnits).where(eq(condominiumUnits.condominiumUnitId, unitId));
    } catch (error: any) {
        // 23503 = FK violation: unit still has members or pending requests
        if ((error?.cause?.code ?? error?.code) === '23503') throw new ConflictError("Unit has members assigned");
        throw error;
    }
}
