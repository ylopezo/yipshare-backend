import { drizzle } from 'drizzle-orm/node-postgres';
import {env} from "@/env.ts";

export const db = drizzle({
    connection: env.DATABASE_URL
});