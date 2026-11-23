import fs from "fs/promises";
import type { Request } from "express";
import path from "path";

export async function cleanupFiles(
  paths?: string[],
  stopAtDir?: string,
): Promise<void> {
  if (!paths || paths.length === 0) return;

  await Promise.allSettled(paths.map((filePath) => fs.unlink(filePath)));

  const dirs = Array.from(
    new Set(paths.map((filePath) => path.dirname(path.resolve(filePath)))),
  ).sort((a, b) => b.length - a.length);

  const root = stopAtDir ? path.resolve(stopAtDir) : null;

  for (const dir of dirs) {
    let current = dir;

    while (
      current &&
      (!root || (current.startsWith(root) && current !== root))
    ) {
      try {
        await fs.rmdir(current);
        if (!root) break;
        current = path.dirname(current);
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException)?.code;
        if (code === "ENOTEMPTY" || code === "ENOENT") {
          break;
        }
        throw err;
      }
    }
  }
}

export const extractFiles = (req: Request): string[] => {
  if (req.fileHandles) {
    return Object.values(req.fileHandles)
      .flat()
      .filter((handle) => handle?.kind === "disk")
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
