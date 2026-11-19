import { Readable } from "stream";

declare global {
    namespace Express {
        namespace Multer {
            interface File {
                hash: string;
                shard: string;
            }
        }
    }
}
