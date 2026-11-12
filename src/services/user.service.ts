import {db} from "@/db/db.ts";
import {notifications, users} from "@/db/schema.ts";
import {and, eq, isNull, ne} from "drizzle-orm";
import {ConflictError, NotFoundError} from "@/utils/errors";
import * as argon2 from 'argon2';

const safeUserColumns = {
    userId: users.userId,
    name: users.name,
    paternalSurname: users.paternalSurname,
    maternalSurname: users.maternalSurname,
    email: users.email,
    phoneNumber: users.phoneNumber,
    username: users.username,
};

export const getUsersService = async () => {
    return db.select().from(users).where(ne(users.state, 'deleted'));
}

export const getUserService = async (id: string) => {
    const [user] = await db.select().from(users).where(and(eq(users.userId, id), ne(users.state, 'deleted')));
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
                                        password?: string | undefined) => {

    await validateConflict(username, email, phoneNumber);

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

async function validateConflict(username: string | undefined, email: string | undefined, phoneNumber: string | undefined) {
    const [[conflictingUsername], [conflictingEmail], [conflictingPhoneNumber]] = await Promise.all([
        username ? db.select().from(users).where(and(eq(users.username, username))).limit(1) : [null],
        email ? db.select().from(users).where(and(eq(users.email, email))).limit(1) : [null],
        phoneNumber ? db.select().from(users).where(and(eq(users.phoneNumber, phoneNumber))).limit(1) : [null],
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

    const [user] = await db.insert(users).values({
        username : username,
        email: email,
        passwordHash : await argon2.hash(password),
        paternalSurname: paternalSurname,
        maternalSurname: maternalSurname,
        name: name,
        phoneNumber : phoneNumber,
    }).returning(safeUserColumns);

    return user;
}

export const deleteUserService = async (id: string) => {
    const [deleted] = await db
        .update(users)
        .set({
            deletedAt: new Date(),
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
}