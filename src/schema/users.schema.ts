import {z} from "zod";
import {CreateCondominiumRequest} from "@/schema/condominium.schema.ts";
import {RegisterRequest} from "@/schema/auth.schema.ts";

export const UserIdParams = z.object({
    id: z.uuid(),
});

export const ModifySelfUserRequest = RegisterRequest.partial().refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const ModifyUserRequest = z.intersection(
    z.object({
        id: z.uuid(),
    }),
    ModifySelfUserRequest
)

