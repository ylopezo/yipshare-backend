import * as z from 'zod';

export const CondominiumIdParams = z.object({
    id: z.uuid(),
});
const CondominiumAddressRequest = z.object({
    name: z.string().trim().min(1, "Name is required"),
    street: z.string().trim().min(1, "Street is required"),
    neighborhood: z.string().trim().min(1, "Neighborhood is required"),
    postalCode: z.string().regex(/^\d{5}$/, "Postal code must be 5 digits"),
    municipality: z.string().trim().min(1, "Municipality is required"),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(1, "State is required"),
});

export const CreateCondominiumRequest = CondominiumAddressRequest.extend({
    units: z.int().min(1).max(500).optional(),
});

export const UpdateCondominiumRequest = CondominiumAddressRequest.partial()
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
    code: z.string().transform((s) => s.trim().toUpperCase().replaceAll('-', '')).pipe(z.string().min(6, "Code must be 6 to 8 characters").max(8, "Code must be 6 to 8 characters")),
    unit: z.string().trim().min(1, "Department number is required"),
    unitId: z.uuid().optional(),
});

export const MemberParams = z.object({
    id: z.uuid(),
    userId: z.uuid(),
});

export const ApproveMemberRequest = z.object({
    unitId: z.uuid().optional(),
});

export const LoanAccessRequest = z.object({
    allowed: z.boolean(),
});
