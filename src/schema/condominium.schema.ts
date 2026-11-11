import * as z from 'zod';

export const CondominiumIdParams = z.object({
    id: z.uuid(),
});
