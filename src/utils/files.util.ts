import fs from 'fs/promises';
import type { Request } from "express";

export async function cleanupFiles(paths?: string[]): Promise<void> {
    if (!paths || paths.length === 0) return;

    await Promise.allSettled(
        paths.map((path) => fs.unlink(path))
    );
}

export const extractFiles = (req: Request): string[] => {
    if (req.fileHandles) {
        return Object.values(req.fileHandles)
            .flat()
            .filter((handle) => handle?.kind === 'disk')
            .map((handle) => handle.path);
    }

    if (req.files) {
        const rawFiles = Array.isArray(req.files)
            ? req.files
            : Object.values(req.files).flat();

        return rawFiles
            .map((f) => f.path)
            .filter((filePath): filePath is string => Boolean(filePath));
    }

    return [];
};
