import { db } from "@/db/db.ts";
import {
  articles,
  condominiumMembers,
  condominiums,
  condominiumUnits,
  loans,
  notifications,
  pendingCondominiumMembers,
  permissionOverrides,
  permissions,
  roles,
  temporaryCondominiumVerificationData,
  userRoles,
  users,
} from "@/db/schema.ts";
import { and, eq, getTableColumns, ilike, isNull, ne, sql } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/utils/errors";
import * as z from "zod";
import {
  CreateCondominiumRequest,
  CreateCondominiumUnitRequest,
  JoinCondominiumRequest,
  UpdateCondominiumRequest,
} from "@/schema/condominiums.schema.ts";
import { getRoleByNameService } from "@/services/roles.service.ts";
import type {
  CondominiumExportType,
  CondominiumSelectType,
} from "@/types/db/schema";
import { decodeInvCode, encodeInvCode } from "@/utils/sqids.util.ts";

export const getCondominiums = async () => {
  return db
    .select({
      ...getTableColumns(condominiums),
      adminUsername: users.username,
      unitCount: sql<number>`(SELECT count(*)::int FROM ${condominiumUnits} WHERE ${condominiumUnits.condominiumId} = ${condominiums.condominiumId})`,
    })
    .from(condominiums)
    .leftJoin(users, eq(users.userId, condominiums.userId))
    .where(ne(condominiums.digitalState, "deleted"));
};

const safeCondominiumFields = {
  condominiumId: condominiums.condominiumId,
  name: condominiums.name,
  adminUsername: users.username,
};

const pendingLoansOf = (
  userId: string,
) => sql<number>`(SELECT count(*)::int FROM ${loans}
    INNER JOIN ${articles} ON ${articles.articleId} = ${loans.articleId}
    WHERE ${loans.lenderId} = ${userId} AND ${loans.state} = 'pending' AND ${articles.condominiumId} = ${condominiums.condominiumId})`;

const pendingMembersCount = sql<number>`(SELECT count(*)::int FROM ${pendingCondominiumMembers}
    WHERE ${pendingCondominiumMembers.condominiumId} = ${condominiums.condominiumId})`;

export const getMyCondominiums = async (userId: string) => {
  const [registered, joined] = await Promise.all([
    db
      .selectDistinct({
        ...safeCondominiumFields,
        shortCode: condominiums.shortCode,
        pendingCount: sql<number>`${pendingLoansOf(userId)} + ${pendingMembersCount}`,
      })
      .from(userRoles)
      .innerJoin(roles, eq(roles.roleId, userRoles.roleId))
      .innerJoin(
        condominiums,
        eq(condominiums.condominiumId, userRoles.condominiumId),
      )
      .innerJoin(users, eq(users.userId, condominiums.userId))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(roles.name, "condominium_admin"),
          eq(condominiums.digitalState, "approved"),
        ),
      ),
    db
      .selectDistinct({
        ...safeCondominiumFields,
        pendingCount: pendingLoansOf(userId),
      })
      .from(condominiumMembers)
      .innerJoin(
        condominiums,
        eq(condominiums.condominiumId, condominiumMembers.condominiumId),
      )
      .innerJoin(users, eq(users.userId, condominiums.userId))
      .where(
        and(
          eq(condominiumMembers.userId, userId),
          eq(condominiums.digitalState, "approved"),
        ),
      ),
  ]);
  return {
    registered: registered.map(({ shortCode, ...condominium }) => ({
      ...condominium,
      code: encodeInvCode(shortCode),
    })),
    joined,
  };
};

export const getCondominiumById = async (id: string) => {
  const [condominium] = await db
    .select()
    .from(condominiums)
    .where(eq(condominiums.condominiumId, id))
    .limit(1);

  if (!condominium || condominium.digitalState === "deleted")
    throw new NotFoundError("Condominium not found");

  return processCondominiumForExport(condominium);
};

export const getUnitsByCondominium = async (id: string) => {
  await getCondominiumById(id);
  return await db
    .select()
    .from(condominiumUnits)
    .where(eq(condominiumUnits.condominiumId, id));
};

type CreateCondominiumData = z.infer<typeof CreateCondominiumRequest>;

export const createCondominium = async (
  ecrpcDocument: string,
  aanaDocument: string,
  ownerIdDocument: string,
  condominiumRfcDocument: string,
  { units, ...data }: CreateCondominiumData,
  userId: string,
) => {
  const role = await getRoleByNameService("condominium_admin");

  return await db.transaction(async (tx) => {
    const [condominium] = await tx
      .insert(condominiums)
      .values({
        ...data,
        userId,
        digitalState: "pending",
      })
      .returning();

    if (!condominium) throw new Error("Failed to register condominium");

    await tx.insert(temporaryCondominiumVerificationData).values({
      condominiumId: condominium.condominiumId,
      ecrpcDocument: ecrpcDocument,
      aanaDocument: aanaDocument,
      ownerIneDocument: ownerIdDocument,
      condominiumRfcDocument: condominiumRfcDocument,
    });

    if (units) {
      await tx.insert(condominiumUnits).values(
        Array.from({ length: units }, (_, index) => ({
          condominiumId: condominium.condominiumId,
          name: String(index + 1),
        })),
      );
    }

    await tx.insert(userRoles).values({
      userId: userId,
      condominiumId: condominium.condominiumId,
      roleId: role.roleId,
      isGlobal: false,
    });

    return processCondominiumForExport(condominium);
  });
};

type UpdateCondominiumData = z.infer<typeof UpdateCondominiumRequest>;

export const updateCondominium = async (
  id: string,
  data: UpdateCondominiumData,
) => {
  await getCondominiumById(id);

  const [condominium] = await db
    .update(condominiums)
    .set(data)
    .where(eq(condominiums.condominiumId, id))
    .returning();

  if (!condominium) throw new NotFoundError("Condominium not found");

  return processCondominiumForExport(condominium);
};

export const deleteCondominium = async (id: string) => {
  await getCondominiumById(id);

  await db
    .update(condominiums)
    .set({ digitalState: "deleted" })
    .where(eq(condominiums.condominiumId, id));
};

export const approveCondominium = async (id: string, userId: string) => {
  const existing = await getCondominiumById(id);
  if (existing.digitalState !== "pending")
    throw new ConflictError("Condominium is not pending");

  return db.transaction(async (tx) => {
    const [condominium] = await tx
      .update(condominiums)
      .set({
        digitalState: "approved",
        approvedAt: new Date(),
        approvedBy: userId,
      })
      .where(eq(condominiums.condominiumId, id))
      .returning();

    await tx.insert(notifications).values({
      userId: existing.userId,
      header: "Condominio aceptado",
      body: `Tu condominio «${existing.name}» fue aceptado. Comparte el código ${existing.code} para que tus vecinos se unan.`,
      action: {
        type: "condominium_approved",
        condominiumId: id,
        shortCode: existing.code,
      },
    });

    return condominium;
  });
};

export const rejectCondominium = async (id: string) => {
  const existing = await getCondominiumById(id);
  if (existing.digitalState !== "pending")
    throw new ConflictError("Condominium is not pending");

  await db.transaction(async (tx) => {
    await tx
      .update(condominiums)
      .set({ digitalState: "deleted" })
      .where(eq(condominiums.condominiumId, id));
    await tx.delete(userRoles).where(eq(userRoles.condominiumId, id));
    await tx.insert(notifications).values({
      userId: existing.userId,
      header: "Condominio rechazado",
      body: `Tu solicitud para registrar «${existing.name}» fue rechazada.`,
      action: { type: "condominium_rejected", condominiumId: id },
    });
  });
};

export const getUnitById = async (condominiumId: string, unitId: string) => {
  await getCondominiumById(condominiumId);
  const [unit] = await db
    .select()
    .from(condominiumUnits)
    .where(
      and(
        eq(condominiumUnits.condominiumId, condominiumId),
        eq(condominiumUnits.condominiumUnitId, unitId),
      ),
    )
    .limit(1);

  if (!unit) throw new NotFoundError("Unit not found");

  return unit;
};

type CondominiumUnitData = z.infer<typeof CreateCondominiumUnitRequest>;

export const createUnit = async (
  condominiumId: string,
  data: CondominiumUnitData,
) => {
  await getCondominiumById(condominiumId);

  const [unit] = await db
    .insert(condominiumUnits)
    .values({ ...data, condominiumId })
    .returning();

  return unit;
};

export const updateUnit = async (
  condominiumId: string,
  unitId: string,
  data: CondominiumUnitData,
) => {
  await getUnitById(condominiumId, unitId);

  const [unit] = await db
    .update(condominiumUnits)
    .set(data)
    .where(eq(condominiumUnits.condominiumUnitId, unitId))
    .returning();

  return unit;
};

export const deleteUnit = async (condominiumId: string, unitId: string) => {
  await getUnitById(condominiumId, unitId);

  try {
    await db
      .delete(condominiumUnits)
      .where(eq(condominiumUnits.condominiumUnitId, unitId));
  } catch (error: any) {
    if ((error?.cause?.code ?? error?.code) === "23503")
      throw new ConflictError("Unit has members assigned");
    throw error;
  }
};

type JoinCondominiumData = z.infer<typeof JoinCondominiumRequest>;

export const requestJoin = async (
  userId: string,
  { code, unit, unitId }: JoinCondominiumData,
) => {
  const [condominium] = await db
    .select()
    .from(condominiums)
    .where(eq(condominiums.shortCode, decodeInvCode(code)))
    .limit(1);
  if (!condominium || condominium.digitalState !== "approved")
    throw new NotFoundError("Invalid code");
  const condominiumId = condominium.condominiumId;

  if (unitId) await getUnitById(condominiumId, unitId);
  const [suggested] = unitId
    ? []
    : await db
        .select({ id: condominiumUnits.condominiumUnitId })
        .from(condominiumUnits)
        .where(
          and(
            eq(condominiumUnits.condominiumId, condominiumId),
            ilike(condominiumUnits.name, unit),
          ),
        )
        .limit(1);

  const [member] = await db
    .select()
    .from(condominiumMembers)
    .where(
      and(
        eq(condominiumMembers.userId, userId),
        eq(condominiumMembers.condominiumId, condominiumId),
      ),
    )
    .limit(1);
  if (member) throw new ConflictError("Already a member");

  const [pending] = await db
    .insert(pendingCondominiumMembers)
    .values({
      userId,
      condominiumId,
      unit,
      suggestedUnitId: unitId ?? suggested?.id ?? null,
    })
    .onConflictDoNothing()
    .returning();
  if (!pending) throw new ConflictError("Request already pending");

  return pending;
};

export const getMembers = async (condominiumId: string) => {
  await getCondominiumById(condominiumId);
  return db
    .select({
      userId: users.userId,
      username: users.username,
      name: users.name,
      paternalSurname: users.paternalSurname,
      phoneNumber: users.phoneNumber,
      computedRating: users.computedRating,
      unitId: condominiumUnits.condominiumUnitId,
      unitName: condominiumUnits.name,
      isAdmin: sql<boolean>`EXISTS (SELECT 1 FROM ${userRoles} INNER JOIN ${roles} ON ${roles.roleId} = ${userRoles.roleId}
                WHERE ${userRoles.userId} = ${users.userId} AND ${userRoles.condominiumId} = ${condominiumId} AND ${roles.name} = 'condominium_admin')`,
      canRequestLoans: sql<boolean>`NOT EXISTS (SELECT 1 FROM ${permissionOverrides} INNER JOIN ${permissions} ON ${permissions.permissionId} = ${permissionOverrides.permissionId}
                WHERE ${permissionOverrides.userId} = ${users.userId} AND ${permissionOverrides.condominiumId} = ${condominiumId}
                AND ${permissions.name} = ${LOAN_PERMISSION} AND ${permissionOverrides.allowed} = false)`,
    })
    .from(condominiumMembers)
    .innerJoin(users, eq(condominiumMembers.userId, users.userId))
    .innerJoin(
      condominiumUnits,
      eq(
        condominiumMembers.condominiumUnitId,
        condominiumUnits.condominiumUnitId,
      ),
    )
    .where(eq(condominiumMembers.condominiumId, condominiumId));
};

export const getPendingMembers = async (condominiumId: string) => {
  await getCondominiumById(condominiumId);
  return db
    .select({
      userId: users.userId,
      username: users.username,
      name: users.name,
      paternalSurname: users.paternalSurname,
      maternalSurname: users.maternalSurname,
      phoneNumber: users.phoneNumber,
      computedRating: users.computedRating,
      unit: pendingCondominiumMembers.unit,
      suggestedUnitId: pendingCondominiumMembers.suggestedUnitId,
    })
    .from(pendingCondominiumMembers)
    .innerJoin(users, eq(pendingCondominiumMembers.userId, users.userId))
    .where(eq(pendingCondominiumMembers.condominiumId, condominiumId));
};

export const approveMember = async (
  condominiumId: string,
  userId: string,
  unitId?: string,
) => {
  if (!unitId) throw new ConflictError("A unit ID must be provided");
  const residentRole = await getRoleByNameService("resident");

  await db.transaction(async (tx) => {
    const [pending] = await tx
      .delete(pendingCondominiumMembers)
      .where(
        and(
          eq(pendingCondominiumMembers.userId, userId),
          eq(pendingCondominiumMembers.condominiumId, condominiumId),
        ),
      )
      .returning();
    if (!pending) throw new NotFoundError("Join request not found");

    await tx.insert(condominiumMembers).values({
      userId,
      condominiumId,
      condominiumUnitId: unitId,
    });
    await tx
      .insert(userRoles)
      .values({
        userId,
        condominiumId,
        roleId: residentRole.roleId,
        isGlobal: false,
      })
      .onConflictDoNothing();
    await tx.insert(notifications).values({
      userId,
      header: "Solicitud aceptada",
      body: "Tu solicitud para unirte al condominio fue aceptada.",
      action: { type: "join_approved", condominiumId },
    });
  });
};

export const rejectMember = async (condominiumId: string, userId: string) => {
  await db.transaction(async (tx) => {
    const [pending] = await tx
      .delete(pendingCondominiumMembers)
      .where(
        and(
          eq(pendingCondominiumMembers.userId, userId),
          eq(pendingCondominiumMembers.condominiumId, condominiumId),
        ),
      )
      .returning();
    if (!pending) throw new NotFoundError("Join request not found");

    await tx.insert(notifications).values({
      userId,
      header: "Solicitud rechazada",
      body: "Tu solicitud para unirte al condominio fue rechazada.",
      action: { type: "join_rejected", condominiumId },
    });
  });
};

export const LOAN_PERMISSION = "users:create.loans";

export const setLoanAccess = async (
  condominiumId: string,
  userId: string,
  adminId: string,
  allowed: boolean,
) => {
  if (userId === adminId)
    throw new ConflictError("You can't change your own access");
  const [member] = await db
    .select()
    .from(condominiumMembers)
    .where(
      and(
        eq(condominiumMembers.userId, userId),
        eq(condominiumMembers.condominiumId, condominiumId),
      ),
    )
    .limit(1);
  if (!member) throw new NotFoundError("Member not found");
  const [permission] = await db
    .select()
    .from(permissions)
    .where(eq(permissions.name, LOAN_PERMISSION))
    .limit(1);
  if (!permission) throw new NotFoundError("Permission not found");

  await db
    .delete(permissionOverrides)
    .where(
      and(
        eq(permissionOverrides.userId, userId),
        eq(permissionOverrides.condominiumId, condominiumId),
        eq(permissionOverrides.permissionId, permission.permissionId),
      ),
    );
  if (!allowed) {
    await db.insert(permissionOverrides).values({
      userId,
      condominiumId,
      permissionId: permission.permissionId,
      allowed: false,
    });
  }
};

export const canRequestLoans = async (
  userId: string,
  condominiumId: string,
) => {
  const [denied] = await db
    .select({ id: permissionOverrides.uuid })
    .from(permissionOverrides)
    .innerJoin(
      permissions,
      eq(permissions.permissionId, permissionOverrides.permissionId),
    )
    .where(
      and(
        eq(permissionOverrides.userId, userId),
        eq(permissionOverrides.condominiumId, condominiumId),
        eq(permissions.name, LOAN_PERMISSION),
        eq(permissionOverrides.allowed, false),
      ),
    )
    .limit(1);
  return !denied;
};

export const removeMember = async (
  condominiumId: string,
  userId: string,
  adminId: string,
) => {
  if (userId === adminId) throw new ConflictError("You can't remove yourself");

  await db.transaction(async (tx) => {
    const removed = await tx
      .delete(condominiumMembers)
      .where(
        and(
          eq(condominiumMembers.userId, userId),
          eq(condominiumMembers.condominiumId, condominiumId),
        ),
      )
      .returning();
    if (removed.length === 0) throw new NotFoundError("Member not found");

    await tx
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.condominiumId, condominiumId),
        ),
      );

    await tx
      .update(articles)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(articles.lendingUser, userId),
          eq(articles.condominiumId, condominiumId),
          isNull(articles.deletedAt),
        ),
      );
  });
};

const processCondominiumForExport = async (
  condominium: CondominiumSelectType,
) => {
  const textCode = encodeInvCode(condominium.shortCode);

  const exportSafeData: CondominiumExportType = {
    ...condominium,
    code: textCode,
  };

  return exportSafeData;
};
