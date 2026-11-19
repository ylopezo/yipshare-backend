import {db} from "@/db/db.ts";
import {NotFoundError} from "@/utils/errors";
import type {JsonValue} from "@/types/util";
import {notifications} from "@/db/schema.ts";
import {and, desc, eq, isNull, sql} from "drizzle-orm";

export const getNotificationsService = async (userId: string) => db
    .select({
        id: notifications.notificationId,
        userId: notifications.userId,
        header: notifications.header,
        body: notifications.body,
        action: notifications.action,
        read: sql<boolean>`${notifications.readAt} IS NOT NULL`,
        createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.notificationId));

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

export const markNotificationAsReadSelf = async (userId: string, notificationId: string) => {
    const [read] = await db
        .update(notifications)
        .set({readAt: new Date()})
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt), eq(notifications.notificationId, notificationId)))
        .returning();
    if (!read) throw new NotFoundError('Notification not found or already marked as read')
}

export const markNotificationAsRead = async (notificationId: string) => {
    const [read] = await db
        .update(notifications)
        .set({readAt: new Date()})
        .where(and(isNull(notifications.readAt), eq(notifications.notificationId, notificationId)))
        .returning();
    if (!read) throw new NotFoundError('Notification not found or already marked as read')
}

export const createNotificationService = async (userId: string, header: string, body: string, action: JsonValue)=> {
    const [notification] = await db.insert(notifications).values({
        userId: userId,
        header: header,
        body: body,
        action: action
    }).returning();
    return notification;
}

export const deleteNotificationService = async (id: string) => {
    const [notification] = await db.delete(notifications).where(eq(notifications.notificationId, id)).returning();
    if (!notification) throw new NotFoundError('Notification not found');
    return notification;
}

export const deleteNotificationSelfService = async (userId: string, id: string) => {
    const [notification] = await db.delete(notifications)
        .where(and(eq(notifications.notificationId, id), eq(notifications.userId, userId)))
        .returning();
    if (!notification) throw new NotFoundError('Notification not found');
}