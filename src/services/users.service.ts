import {db} from "@/db/db.ts";
import {sessions, userRoles, users} from "@/db/schema.ts";
import {and, eq, isNull, ne} from "drizzle-orm";
import {ConflictError, NotFoundError, UnauthorizedError} from "@/utils/errors";
import * as argon2 from 'argon2';
import {getRoleByNameService} from "@/services/roles.service.ts";

const publicUserColumns = {
    userId: users.userId,
    name: users.name,
    paternalSurname: users.paternalSurname,
    maternalSurname: users.maternalSurname,
    phoneNumber: users.phoneNumber,
    username: users.username,
    computedRating: users.computedRating,
};

const safeUserColumns = {
    ...publicUserColumns,
    email: users.email,
};

export const getUsersService = async () => {
    return db.select(safeUserColumns).from(users).where(ne(users.state, 'deleted'));
}

export const getUserService = async (id: string) => {
    const [user] = await db.select(safeUserColumns).from(users).where(and(eq(users.userId, id), ne(users.state, 'deleted')));
    if (!user) throw new NotFoundError('User not found');
    return user;
}

export const getUserProfileService = async (id: string) => {
    const [user] = await db.select(publicUserColumns).from(users).where(and(eq(users.userId, id), ne(users.state, 'deleted')));
    if (!user) throw new NotFoundError('User not found');
    return user;
}

export const modifyUserService = async (userId: string,
                                        name?: string | undefined,
                                        paternalSurname?: string | undefined,
                                        maternalSurname?: string | undefined,
                                        email?: string | undefined,
                                        phoneNumber?: string | undefined,
                                        username?: string | undefined,
                                        password?: string | undefined,
                                        currentPassword?: string | undefined) => {

    await validateConflict(username, email, phoneNumber, userId);

    if (password && currentPassword !== undefined) {
        const [stored] = await db.select({passwordHash: users.passwordHash}).from(users).where(eq(users.userId, userId)).limit(1);
        if (!stored?.passwordHash || !(await argon2.verify(stored.passwordHash, currentPassword))) {
            throw new UnauthorizedError('Wrong password');
        }
    }

    const updateData = {
        name,
        paternalSurname,
        maternalSurname,
        email,
        phoneNumber,
        username,
        passwordHash: password ? await argon2.hash(password) : undefined,
    };

    if (Object.values(updateData).every((val) => val === undefined)) {
        const [existingUser] = await db.select(safeUserColumns).from(users).where(eq(users.userId, userId)).limit(1);
        return existingUser;
    }

    const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.userId, userId))
        .returning(safeUserColumns);


    if (!user) throw new NotFoundError('User not found');

    return user;
}

async function validateConflict(username: string | undefined, email: string | undefined, phoneNumber: string | undefined, userId?: string) {
    const notSelf = userId ? ne(users.userId, userId) : undefined;
    const [[conflictingUsername], [conflictingEmail], [conflictingPhoneNumber]] = await Promise.all([
        username ? db.select().from(users).where(and(eq(users.username, username), notSelf)).limit(1) : [null],
        email ? db.select().from(users).where(and(eq(users.email, email), notSelf)).limit(1) : [null],
        phoneNumber ? db.select().from(users).where(and(eq(users.phoneNumber, phoneNumber), notSelf)).limit(1) : [null],
    ]);

    if (conflictingUsername) throw new ConflictError(`The username \'${username}\' is already registered.\'`);
    if (conflictingEmail) throw new ConflictError(`The email \'${email}\' is already registered.`);
    if (conflictingPhoneNumber) throw new ConflictError(`The phone \'${phoneNumber}\' is already registered.`);
}

export const createUserService = async (name: string,
                                        paternalSurname: string,
                                        maternalSurname: string,
                                        email: string,
                                        phoneNumber: string,
                                        username: string,
                                        password: string) => {

    await validateConflict(username, email, phoneNumber);
    const userRole = await getRoleByNameService('user');
    const passwordHash = await argon2.hash(password);

    return db.transaction(async (tx) => {
        const [user] = await tx.insert(users).values({
            username : username,
            email: email,
            passwordHash : passwordHash,
            paternalSurname: paternalSurname,
            maternalSurname: maternalSurname,
            name: name,
            phoneNumber : phoneNumber,
        }).returning(safeUserColumns);

        if (user) await tx.insert(userRoles).values({userId: user.userId, roleId: userRole.roleId, condominiumId: null, isGlobal: true});
        return user;
    });
}

export const deleteUserService = async (id: string) => {
    const [deleted] = await db
        .update(users)
        .set({
            deletedAt: new Date(),
            state: 'deleted',
            email: null,
            username: null,
            phoneNumber: null,
            name: 'Deleted User',
            paternalSurname: null,
            maternalSurname: null,
            passwordHash: null,
        })
        .where(and(eq(users.userId, id), isNull(users.deletedAt)))
        .returning({ userId: users.userId });
    if (!deleted) throw new NotFoundError('User not found');
    await db.delete(sessions).where(eq(sessions.userId, id));
}

export const uploadPFPService = async (userId: string, image: string) => {
    const [user] = await db.update(users)
        .set({profile_picture : image})
        .where(eq(users.userId, userId))
        .returning();
    return user;
}