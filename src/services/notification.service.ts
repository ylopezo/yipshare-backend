import {db} from "@/db/db.ts";
import {notifications} from "@/db/schema.ts";
import {and, desc, eq, isNull, sql} from "drizzle-orm";

export const getNotifications = async (userId: string) => db
    .select({
        id: notifications.notificationId,
        header: notifications.header,
        body: notifications.body,
        action: notifications.action,
        read: sql<boolean>`${notifications.readAt} IS NOT NULL`,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.notificationId));

export const markNotificationsAsRead = async (userId: string) => {
    await db
        .update(notifications)
        .set({readAt: new Date()})
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
import {NotFoundError} from "@/utils/errors";
import type {JsonValue} from "@/types/util";

export const getNotificationsService = async (id: string) => {
    return await db.select().from(notifications).where(eq(notifications.userId, id));
}

export const getNotificationService = async (notificationId: string) => {
    const [notification] = await db.select().from(notifications).where(eq(notifications.notificationId, notificationId))
    if (!notification) throw new NotFoundError('Notification not found');
    return notification;
}
export const getNotificationServiceUserFiltered = async (userId: string, notificationId: string) => {
    const [notification] = await db.select().from(notifications).where(eq(notifications.notificationId, notificationId))
    if (!notification || notification.userId != userId) throw new NotFoundError('Notification not found');
    return notification;
}

export const createNotificationService = async (userId: string, header: string, body: string, action: JsonValue, image?: string, )=> {
    const [notification] = await db.insert(notifications).values({
        userId: userId,
        header: header,
        body: body,
        image: image,
        action: action
    }).returning();
    return notification;
}

export const deleteNotificationService = async (id: string) => {
    const [notification] = await db.delete(notifications).where(eq(notifications.notificationId, id));
    if (!notification) throw new NotFoundError('Notification not found');
    return notification;
}
