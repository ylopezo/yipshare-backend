import type { UserSession } from "@/middlewares/authentication.middleware.ts";
import type { FileHandle } from "@/types/files";

declare global {
    namespace Express {
        interface Request {
            session?: UserSession;
            permissions?: Set<string>;
            condominiumId?: string | null;
            fileHandles?: Record<string, FileHandle[] | undefined>;
        }
    }
}
