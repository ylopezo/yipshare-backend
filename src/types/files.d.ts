import type {FileSchema} from "@/middlewares/files.middleware.ts";

export type FileHandle = DiskFileHandle | MemoryFileHandle

export interface DiskFileHandle {
    id: string;
    mimeType: string;
    size: number;
    url: string;
    path: string;
    kind: 'disk'
}

export interface MemoryFileHandle {
    kind: 'memory'
    mimeType: string;
    size: number;
    buffer: Buffer;
}

export interface FieldRule<TOutput = DiskFileHandle> {
    required?: boolean,
    maxCount?: number
    validator?: (file: Express.Multer.File) => boolean | Promise<boolean>
    saveBuffer?: (file: Buffer) => Promise<{id: string, path: string}>
}

export type FileSchema = Record<string, FieldRule>

export type FileHandlesFromSchema<TSchema extends FileSchema, THandle = FileHandle> = {
    [K in keyof TSchema]: TSchema[K]['required'] extends true
        ? THandle[]
        : THandle[] | undefined;
}