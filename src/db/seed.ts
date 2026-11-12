import "dotenv/config";
import { db } from "@/db/db.ts";
import { permissions, roles, rolePermissions, users, userRoles } from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import {ALL_PERMS} from "@/types/permissions.ts";
import {env} from "@/env.ts";
import * as argon2 from "argon2";

async function seed() {
    const password = env.ADMIN_PASSWORD;

    if (!password) {
        console.log("CRITICAL: missing ADMIN_PASSWORD in .env file to seed database");
        return;
    }

    console.log("Seeding database...");

    await db
        .insert(permissions)
        .values(ALL_PERMS.map((name) => ({ name })))
        .onConflictDoNothing({ target: permissions.name });

    const allDbPermissions = await db.select().from(permissions);
    const globalPermissions = allDbPermissions.filter((perm) => !perm.name.startsWith("report:"));

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
                }))
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
        (perm) => perm.name !== "admin:test"
    );

    if (adminRole && filteredPermissions.length > 0) {
        await db
            .insert(rolePermissions)
            .values(
                filteredPermissions.map((perm) => ({
                    roleId: adminRole.roleId,
                    permissionId: perm.permissionId,
                    allowed: true,
                }))
            )
            .onConflictDoNothing();
    }

    const [condominiumAdminRole] = await db
        .insert(roles)
        .values({ name: "condominium_admin" })
        .onConflictDoUpdate({
            target: roles.name,
            set: { name: "condominium_admin" },
        })
        .returning();

    const reportPermissions = allDbPermissions.filter((perm) => perm.name.startsWith("report:"));

    if (condominiumAdminRole && reportPermissions.length > 0) {
        await db
            .insert(rolePermissions)
            .values(
                reportPermissions.map((perm) => ({
                    roleId: condominiumAdminRole.roleId,
                    permissionId: perm.permissionId,
                    allowed: true,
                }))
            )
            .onConflictDoNothing();
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