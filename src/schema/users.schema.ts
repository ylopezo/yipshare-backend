import {z} from "zod";
import {RegisterRequest} from "@/schema/auth.schema.ts";

export const UserIdParams = z.object({
    id: z.uuid(),
});

export const ModifyUserRequest = RegisterRequest.partial().extend({currentPassword: z.string().optional()}).refine((data) => Object.keys(data).length > 0, "At least one field is required");