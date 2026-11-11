import type {UserSession} from "@/middlewares/authentication.middleware.ts";
import type {Permission} from "@/types/permissions.ts";

declare global {
    namespace Express {
        interface Request {
            session?: UserSession;
            permissions?: Set<string>;
            condominiumId?: string | null;
        }
    }
}