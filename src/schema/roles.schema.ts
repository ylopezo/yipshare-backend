import { z } from "zod";

export const RoleFetchIdParams = z.object({
    id: z.uuid(),
});

export const RoleFetchByNameParams = z.object({
    name: z.uuid(),
});

export const RoleCreateParams = z.object({
    name: z.string(),
});

export const RolePermissionParams = z.object({
    permissions: z.string().array(),
});
