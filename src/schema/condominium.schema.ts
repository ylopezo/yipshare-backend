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