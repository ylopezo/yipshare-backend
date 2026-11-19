import {z} from "zod";

export const NotificationFetchIdParams = z.object({
    id: z.uuid(),
});

export const NotificationCreate = z.object({
    userId: z.uuid(),
    header: z.string(),
    body: z.string(),
    action: z.json(),
})