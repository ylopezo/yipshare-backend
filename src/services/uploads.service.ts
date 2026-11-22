import {stat} from "node:fs/promises";
import {resolve, sep} from "node:path";
import {BadRequestError, NotFoundError} from "@/utils/errors.ts";
import path from "node:path";
import {createReadStream} from "node:fs";
import {fileTypeFromFile} from "file-type";


export const getFileService = async (base: string, uuid: string) => {
    if (uuid.length < 4) {
        throw new BadRequestError('Invalid file ID');
    }

    const root = path.resolve(base);
    const resolvedPath = resolve(root, `${uuid.substring(0, 4)}/${uuid}`);

    if (!resolvedPath.startsWith(root + sep)) {
        throw new BadRequestError('Invalid file path');
    }

    const fileStat = await stat(resolvedPath).catch(() => null);
    if (!fileStat?.isFile()) {
        throw new NotFoundError('File not found');
    }

    const detected = await fileTypeFromFile(resolvedPath);
    const contentType = detected?.mime || 'application/octet-stream';
    const filename = detected?.ext ? `${uuid}.${detected.ext}` : uuid;

    const stream = createReadStream(resolvedPath);

    return {
        stream,
        contentType,
        size: fileStat.size,
        filename,
    };
};