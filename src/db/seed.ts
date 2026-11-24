import "dotenv/config";
import { db } from "@/db/db.ts";
import {
  categories,
  permissions,
  roles,
  rolePermissions,
  users,
  userRoles,
} from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import { ALL_PERMS, type Permission } from "@/types/permissions.ts";
import { env } from "@/env.ts";
import * as argon2 from "argon2";

async function seed() {
  const password = env.ADMIN_PASSWORD;

  if (!password) {
    console.log(
      "CRITICAL: missing ADMIN_PASSWORD in .env file to seed database",
    );
    return;
  }

  console.log("Seeding database...");

  await db
    .insert(permissions)
    .values(ALL_PERMS.map((name) => ({ name })))
    .onConflictDoNothing({ target: permissions.name });

  await db
    .insert(categories)
    .values(
      [
        "Herramientas",
        "Electrodomésticos",
        "Jardinería",
        "Cocina",
        "Limpieza",
        "Electrónica",
        "Automotriz",
        "Otros",
      ].map((name) => ({ name })),
    )
    .onConflictDoNothing({ target: categories.name });

  const allDbPermissions = await db.select().from(permissions);
  const globalPermissions = allDbPermissions.filter(
    (perm) => !perm.name.startsWith("report:"),
  );

  const [superAdminRole] = await db
    .insert(roles)
    .values({ name: "super_admin" })
    .onConflictDoUpdate({
      target: roles.name,
      set: { name: "super_admin" },
    })
    .returning();

  if (superAdminRole && globalPermissions.length > 0) {
    await db
      .insert(rolePermissions)
      .values(
        globalPermissions.map((perm) => ({
          roleId: superAdminRole.roleId,
          permissionId: perm.permissionId,
          allowed: true,
        })),
      )
      .onConflictDoNothing();
  }

  const [adminRole] = await db
    .insert(roles)
    .values({ name: "admin" })
    .onConflictDoUpdate({
      target: roles.name,
      set: { name: "admin" },
    })
    .returning();

  const filteredPermissions = globalPermissions.filter(
    (perm) => perm.name !== "admin:test",
  );

  if (adminRole && filteredPermissions.length > 0) {
    await db
      .insert(rolePermissions)
      .values(
        filteredPermissions.map((perm) => ({
          roleId: adminRole.roleId,
          permissionId: perm.permissionId,
          allowed: true,
        })),
      )
      .onConflictDoNothing();
  }

  const grantRole = async (name: string, permissionNames: Permission[]) => {
    const [role] = await db
      .insert(roles)
      .values({ name })
      .onConflictDoUpdate({ target: roles.name, set: { name } })
      .returning();
    const granted = allDbPermissions.filter((perm) =>
      permissionNames.includes(perm.name),
    );
    if (role && granted.length > 0) {
      await db
        .insert(rolePermissions)
        .values(
          granted.map((perm) => ({
            roleId: role.roleId,
            permissionId: perm.permissionId,
            allowed: true,
          })),
        )
        .onConflictDoNothing();
    }
    return role;
  };

  const userRole = await grantRole("user", [
    "users:read.self",
    "users:read.profile",
    "users:update.self",
    "users:update.self.pfp",
    "users:delete.self",
    "users:read.notifications",
    "users:update.notifications.markRead",
    "users:delete.notifications",
    "users:read.loans.all",
    "users:read.loans",
    "users:create.loans",
    "users:update.loans.verificationCode",
    "users:update.loans.accept",
    "users:update.loans.return",
    "users:create.reports",
    "users:read.reports.all",
    "users:create.reviews",
    "users:read.reviews.all",
    "condominium:create",
  ]);

  const residentPermissions = [
    "condominium:read",
    "condominium:read.articles",
    "condominium:read.articles.all",
    "condominium:create.articles",
    "condominium:update.articles",
    "condominium:delete.articles",
  ];
  await grantRole("resident", residentPermissions);
  await grantRole("condominium_admin", [
    ...residentPermissions,
    "condominium:update",
    "condominium:read.units",
    "condominium:create.units",
    "condominium:update.units",
    "condominium:delete.units",
    "condominium:read.members",
    "condominium:approve.members",
    "condominium:update.members",
    "condominium:delete.members",
    "condominium:read.loans.all",
    "report:read",
    "report:update",
  ]);

  if (userRole) {
    const everyone = await db.select({ userId: users.userId }).from(users);
    if (everyone.length > 0) {
      await db
        .insert(userRoles)
        .values(
          everyone.map(({ userId }) => ({
            userId,
            roleId: userRole.roleId,
            condominiumId: null,
            isGlobal: true,
          })),
        )
        .onConflictDoNothing();
    }
  }

  const hashedPassword = await argon2.hash(password);

  const [superAdminUser] = await db
    .insert(users)
    .values({
      email: "superadmin@test.com",
      name: "Super Admin",
      passwordHash: hashedPassword,
      username: "superadmin",
      paternalSurname: "Admin",
      maternalSurname: "User",
      phoneNumber: "N/A",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { email: "superadmin@test.com", passwordHash: hashedPassword },
    })
    .returning();

  const [adminUser] = await db
    .insert(users)
    .values({
      email: "admin@test.com",
      name: "Test Admin",
      passwordHash: hashedPassword,
      username: "admin",
      paternalSurname: "Admin",
      maternalSurname: "User",
      phoneNumber: "N/A",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { email: "admin@test.com", passwordHash: hashedPassword },
    })
    .returning();

  if (superAdminUser && superAdminRole) {
    await db
      .insert(userRoles)
      .values({
        userId: superAdminUser.userId,
        roleId: superAdminRole.roleId,
        condominiumId: null,
        isGlobal: true,
      })
      .onConflictDoNothing();
  }

  if (adminUser && adminRole) {
    await db
      .insert(userRoles)
      .values({
        userId: adminUser.userId,
        roleId: adminRole.roleId,
        condominiumId: null,
        isGlobal: true,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
