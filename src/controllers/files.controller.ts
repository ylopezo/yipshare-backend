import type {NextFunction, Request, Response} from "express";
import {FileRequestParams} from "@/schema/files.schema.ts";
import {getFileService} from "@/services/uploads.service.ts";
import {env} from "@/env.ts";
import { pipeline } from 'node:stream';
import {NotFoundError} from "@/utils/errors.ts";

interface StreamFileOptions {
    stream: NodeJS.ReadableStream;
    contentType: string;
    size: number;
    filename: string;
    cacheControl?: string;
}
const ALLOWED_IMAGE_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
]);

export const getDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = FileRequestParams.parse(req.params);
        const file = await getFileService(env.UPLOADS_DIR, id);

        if (file.contentType !== 'application/pdf') {
            file.stream.destroy();
            console.warn(`[Data Integrity] Non-PDF file (${file.contentType}) found in UPLOADS_DIR for ID: ${id}`);
            throw new NotFoundError('Document not found');
        }

        sendFileStream(res, next, {
            ...file,
            cacheControl: 'private, max-age=3600',
        });
    } catch (error) {
        next(error);
    }
};

export const getPFP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = FileRequestParams.parse(req.params);
        const file = await getFileService(env.PFPS_DIR, id);

        if (file.contentType !== 'image/webp') {
            file.stream.destroy();
            console.warn(`[Data Integrity] Non-WEBP file (${file.contentType}) found in PFPS_DIR for ID: ${id}`);
            throw new NotFoundError('PFP not found');
        }

        sendFileStream(res, next, {
            ...file,
            cacheControl: 'private, max-age=31536000, immutable',
        });
    } catch (error) {
        next(error);
    }
};


export const getImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = FileRequestParams.parse(req.params);
        const file = await getFileService(env.IMAGES_DIR, id);

        if (!ALLOWED_IMAGE_TYPES.has(file.contentType)) {
            file.stream.destroy();
            console.warn(`[Data Integrity] Non-Image file (${file.contentType}) found in IMAGE_DIR for ID: ${id}`);
            throw new NotFoundError('Image not found');
        }

        sendFileStream(res, next, {
            ...file,
            cacheControl: 'private, max-age=31536000, immutable',
        });
    } catch (error) {
        next(error);
    }
};

export const sendFileStream = (
    res: Response,
    next: NextFunction,
    { stream, contentType, size, filename, cacheControl }: StreamFileOptions
) => {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (cacheControl) {
        res.setHeader('Cache-Control', cacheControl);
    }

    const csp = contentType === 'application/pdf'
        ? "default-src 'none';"
        : "default-src 'none'; sandbox;";
    res.setHeader('Content-Security-Policy', csp);

    pipeline(stream, res, (err) => {
        if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
            if (!res.headersSent) next(err);
        }
    });
};
