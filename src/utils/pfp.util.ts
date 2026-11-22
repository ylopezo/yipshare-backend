import sharp = require("sharp");
import path from "node:path";
import crypto from "crypto";
import { env } from "@/env.ts";
import fs from "fs/promises";

export async function resizePFP(file: Buffer): Promise<{ id: string; path: string }> {
    const hash = crypto.randomBytes(16).toString("hex");
    const shard = hash.substring(0, 4);
    const dirPath = path.join(env.PFPS_DIR, shard);

    await fs.mkdir(dirPath, { recursive: true });

    const resolvedPath = path.join(dirPath, `${hash}`);

    const image = sharp(file).rotate();
    const metadata = await image.metadata();

    const size = Math.min(metadata.width ?? 512, metadata.height ?? 512, 512);

    await image
        .resize({
            width: size,
            height: size,
            fit: "cover",
            position: "attention",
        })
        .webp({
            quality: 80,
        })
        .toFile(resolvedPath);

    return { id: hash, path: resolvedPath };
}
