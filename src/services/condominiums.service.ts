import {db} from "@/db/db.ts";
import {articles, condominiumMembers, condominiums, condominiumUnits, notifications, pendingCondominiumMembers, roles, userRoles, users} from "@/db/schema.ts";
import {and, eq, getTableColumns, isNull, ne, sql} from "drizzle-orm";
import {randomBytes} from "node:crypto";
import {ConflictError, NotFoundError} from "@/utils/errors";
import * as z from "zod";
import {CreateCondominiumRequest, CreateCondominiumUnitRequest, JoinCondominiumRequest, UpdateCondominiumRequest} from "@/schema/condominiums.schema.ts";

export const getCondominiums = async () => {
    return db
        .select({
            ...getTableColumns(condominiums),
            adminUsername: users.username,
            unitCount: sql<number>`(SELECT count(*)::int FROM ${condominiumUnits} WHERE ${condominiumUnits.condominiumId} = ${condominiums.condominiumId})`,
        })
        .from(condominiums)
        .leftJoin(users, eq(users.userId, condominiums.userId))
        .where(ne(condominiums.digitalState, 'deleted'));
}

const safeCondominiumFields = {
    condominiumId: condominiums.condominiumId,
    name: condominiums.name,
    adminUsername: users.username,
};

export const getMyCondominiums = async (userId: string) => {
    const [registered, joined] = await Promise.all([
        db.selectDistinct(safeCondominiumFields)
            .from(userRoles)
            .innerJoin(roles, eq(roles.roleId, userRoles.roleId))
            .innerJoin(condominiums, eq(condominiums.condominiumId, userRoles.condominiumId))
            .innerJoin(owner, eq(owner.userId, condominiums.userId))
            .where(and(
                eq(userRoles.userId, userId),
                eq(roles.name, 'condominium_admin'),
                eq(condominiums.digitalState, 'approved'),
            )),
        db.selectDistinct(safeCondominiumFields)
            .from(condominiumMembers)
            .innerJoin(condominiums, eq(condominiums.condominiumId, condominiumMembers.condominiumId))
            .innerJoin(owner, eq(owner.userId, condominiums.userId))
            .where(and(
                eq(condominiumMembers.userId, userId),
                eq(condominiums.digitalState, 'approved'),
            )),
    ]);
    return {registered, joined};
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
    const adminRoleId = await getRoleId('condominium_admin');

    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            return await db.transaction(async (tx) => {
                const [condominium] = await tx.insert(condominiums).values({
                    ...data, userId,
                    shortCode: randomBytes(3).toString('hex').toUpperCase(),
                    digitalState: 'pending',
                }).returning();

                await tx.insert(userRoles).values({
                    userId, condominiumId: condominium!.condominiumId,
                    roleId: adminRoleId, isGlobal: false,
                });
                return condominium;
            });
        } catch (error: any) {
            if ((error?.cause?.code ?? error?.code) !== '23505') throw error;
        }
    }
    throw new ConflictError("Could not generate a unique code");
}

type UpdateCondominiumData = z.infer<typeof UpdateCondominiumRequest>;

export const updateCondominium = async (id: string, data: UpdateCondominiumData) => {
    await getCondominiumById(id);

    const [condominium] = await db
        .update(condominiums)
        .set(data)
        .where(eq(condominiums.condominiumId, id))
        .returning();

    return condominium;
}

export const deleteCondominium = async (id: string) => {
    await getCondominiumById(id);

    await db
        .update(condominiums)
        .set({digitalState: 'deleted'})
        .where(eq(condominiums.condominiumId, id));
}

export const approveCondominium = async (id: string, userId: string) => {
    const existing = await getCondominiumById(id);
    if (existing.digitalState !== 'pending') throw new ConflictError("Condominium is not pending");

    return db.transaction(async (tx) => {
        const [condominium] = await tx
            .update(condominiums)
            .set({digitalState: 'approved', approvedAt: new Date(), approvedBy: userId})
            .where(eq(condominiums.condominiumId, id))
            .returning();

        await tx.insert(notifications).values({
            userId: existing.userId,
            header: 'Condominio aceptado',
            body: `Tu condominio «${existing.name}» fue aceptado. Comparte el código para que tus vecinos se unan.`,
            action: {type: 'condominium_approved', condominiumId: id, shortCode: existing.shortCode},
        });

        return condominium;
    });
}

export const rejectCondominium = async (id: string) => {
    const existing = await getCondominiumById(id);
    if (existing.digitalState !== 'pending') throw new ConflictError("Condominium is not pending");

    await db.transaction(async (tx) => {
        await tx.update(condominiums).set({digitalState: 'deleted'}).where(eq(condominiums.condominiumId, id));
        await tx.delete(userRoles).where(eq(userRoles.condominiumId, id));
        await tx.insert(notifications).values({
            userId: existing.userId,
            header: 'Condominio rechazado',
            body: `Tu solicitud para registrar «${existing.name}» fue rechazada.`,
            action: {type: 'condominium_rejected', condominiumId: id},
        });
    });
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

export const createUnit = async (condominiumId: string, data: CondominiumUnitData) => {
    await getCondominiumById(condominiumId);

    const [unit] = await db
        .insert(condominiumUnits)
        .values({...data, condominiumId})
        .returning();

    return unit;
}

export const updateUnit = async (condominiumId: string, unitId: string, data: CondominiumUnitData) => {
    await getUnitById(condominiumId, unitId);

    const [unit] = await db
        .update(condominiumUnits)
        .set(data)
        .where(eq(condominiumUnits.condominiumUnitId, unitId))
        .returning();

    return unit;
}

export const deleteUnit = async (condominiumId: string, unitId: string) => {
    await getUnitById(condominiumId, unitId);

    try {
        await db.delete(condominiumUnits).where(eq(condominiumUnits.condominiumUnitId, unitId));
    } catch (error: any) {
        if ((error?.cause?.code ?? error?.code) === '23503') throw new ConflictError("Unit has members assigned");
        throw error;
    }
}

type JoinCondominiumData = z.infer<typeof JoinCondominiumRequest>;

export const requestJoin = async (userId: string, {code, unit, unitId}: JoinCondominiumData) => {
    const [condominium] = await db.select().from(condominiums).where(eq(condominiums.shortCode, code)).limit(1);
    if (!condominium || condominium.digitalState !== 'approved') throw new NotFoundError("Invalid code");
    const condominiumId = condominium.condominiumId;

    if (unitId) await getUnitById(condominiumId, unitId);

    const [member] = await db
        .select()
        .from(condominiumMembers)
        .where(and(eq(condominiumMembers.userId, userId), eq(condominiumMembers.condominiumId, condominiumId)))
        .limit(1);
    if (member) throw new ConflictError("Already a member");

    const [pending] = await db
        .insert(pendingCondominiumMembers)
        .values({userId, condominiumId, unit, suggestedUnitId: unitId ?? null})
        .onConflictDoNothing()
        .returning();
    if (!pending) throw new ConflictError("Request already pending");

    return pending;
}

export const getMembers = async (condominiumId: string) => {
    await getCondominiumById(condominiumId);
    return db
        .select({
            userId: users.userId,
            username: users.username,
            name: users.name,
            paternalSurname: users.paternalSurname,
            unitId: condominiumUnits.condominiumUnitId,
            unitName: condominiumUnits.name,
        })
        .from(condominiumMembers)
        .innerJoin(users, eq(condominiumMembers.userId, users.userId))
        .innerJoin(condominiumUnits, eq(condominiumMembers.condominiumUnitId, condominiumUnits.condominiumUnitId))
        .where(eq(condominiumMembers.condominiumId, condominiumId));
}

export const getPendingMembers = async (condominiumId: string) => {
    await getCondominiumById(condominiumId);
    return db
        .select({
            userId: users.userId,
            username: users.username,
            name: users.name,
            paternalSurname: users.paternalSurname,
            unit: pendingCondominiumMembers.unit,
            suggestedUnitId: pendingCondominiumMembers.suggestedUnitId,
        })
        .from(pendingCondominiumMembers)
        .innerJoin(users, eq(pendingCondominiumMembers.userId, users.userId))
        .where(eq(pendingCondominiumMembers.condominiumId, condominiumId));
}

export const approveMember = async (condominiumId: string, userId: string, unitId?: string) => {
    if (unitId) await getUnitById(condominiumId, unitId);
    const residentRoleId = await getRoleId('resident');

    await db.transaction(async (tx) => {
        const [pending] = await tx
            .delete(pendingCondominiumMembers)
            .where(and(eq(pendingCondominiumMembers.userId, userId), eq(pendingCondominiumMembers.condominiumId, condominiumId)))
            .returning();
        if (!pending) throw new NotFoundError("Join request not found");

        const condominiumUnitId = unitId ?? pending.suggestedUnitId;
        if (!condominiumUnitId) throw new ConflictError("A unit is required to approve this member");

        await tx.insert(condominiumMembers).values({userId, condominiumId, condominiumUnitId});
        await tx
            .insert(userRoles)
            .values({userId, condominiumId, roleId: residentRoleId, isGlobal: false})
            .onConflictDoNothing();
    });
}

export const removeMember = async (condominiumId: string, userId: string, adminId: string) => {
    if (userId === adminId) throw new ConflictError("You can't remove yourself");

    await db.transaction(async (tx) => {
        const removed = await tx
            .delete(condominiumMembers)
            .where(and(eq(condominiumMembers.userId, userId), eq(condominiumMembers.condominiumId, condominiumId)))
            .returning();
        if (removed.length === 0) throw new NotFoundError("Member not found");

        await tx
            .delete(userRoles)
            .where(and(eq(userRoles.userId, userId), eq(userRoles.condominiumId, condominiumId)));

        await tx
            .update(articles)
            .set({deletedAt: new Date()})
            .where(and(eq(articles.lendingUser, userId), eq(articles.condominiumId, condominiumId), isNull(articles.deletedAt)));
    });
}
