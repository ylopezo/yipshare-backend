import {mkdir, stat, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {v7 as uuidv7} from "uuid";
import {BadRequestError, NotFoundError} from "@/utils/errors";

const UPLOADS_DIR = resolve('uploads');
const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'application/pdf': 'pdf',
};

export const saveUpload = async (contentType: string | undefined, body: unknown) => {
    const extension = EXTENSIONS[contentType ?? ''];
    if (!extension || !Buffer.isBuffer(body) || body.length === 0) throw new BadRequestError('Send a JPEG, PNG or PDF file');

    const name = `${uuidv7()}.${extension}`;
    await mkdir(UPLOADS_DIR, {recursive: true});
    await writeFile(resolve(UPLOADS_DIR, name), body);
    return `/uploads/${name}`;
}

export const getUploadPath = async (name: string) => {
    const path = resolve(UPLOADS_DIR, name);
    if (!(await stat(path).catch(() => null))?.isFile()) throw new NotFoundError('File not found');
    return path;
}
