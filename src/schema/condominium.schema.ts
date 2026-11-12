import * as z from 'zod';

export const CondominiumIdParams = z.object({
    id: z.uuid(),
});
export const CreateCondominiumRequest = z.object({
    name: z.string().trim().min(1, "Name is required"),
    street: z.string().trim().min(1, "Street is required"),
    neighborhood: z.string().trim().min(1, "Neighborhood is required"),
    postalCode: z.string().regex(/^\d{5}$/, "Postal code must be 5 digits"),
    municipality: z.string().trim().min(1, "Municipality is required"),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(1, "State is required"),
});

export const UpdateCondominiumRequest = CreateCondominiumRequest.partial()
    .refine((data) => Object.keys(data).length > 0, "At least one field is required");
export const CondominiumUnitParams = z.object({
    id: z.uuid(),
    unitId: z.uuid(),
});

export const CreateCondominiumUnitRequest = z.object({
    name: z.string().trim().min(1, "Name is required"),
});

export const UpdateCondominiumUnitRequest = CreateCondominiumUnitRequest;

export const JoinCondominiumRequest = z.object({
    code: z.string().trim().length(6, "Code must be 6 characters").transform((s) => s.toUpperCase()),
    unit: z.string().trim().min(1, "Department number is required"),
    unitId: z.uuid(),
});

export const MemberParams = z.object({
    id: z.uuid(),
    userId: z.uuid(),
});

export const ApproveMemberRequest = z.object({
    unitId: z.uuid().optional(),
});
