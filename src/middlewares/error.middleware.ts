import type { Request, Response, NextFunction } from 'express';
import {AppError} from "@/utils/errors.ts";
import {z, ZodError} from "zod";
import {cleanupFiles, extractFiles} from "@/utils/files.util.ts";


const errorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {

    const uploadedFiles = extractFiles(req);
    if (uploadedFiles.length > 0) {
        await cleanupFiles(uploadedFiles);
    }

    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: z.flattenError(err),
        });
    }

    if (err instanceof AppError) {
        const statusCode = err.statusCode || 500;
        const isServerError = statusCode >= 500;

        if (isServerError) {
            console.error('Handled 500 AppError:', err);
        }

        return res.status(statusCode).json({
            success: false,
            message: isServerError ? 'Internal Server Error' : err.message,
        });
    }

    if (err?.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'File too large',
        });
    }

    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload',
        });
    }

    console.error('UNHANDLED CRITICAL EXCEPTION:', err);

    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
}

export default errorHandler;