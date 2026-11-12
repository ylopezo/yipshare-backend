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
