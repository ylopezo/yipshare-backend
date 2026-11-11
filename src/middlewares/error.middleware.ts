import type { Request, Response, NextFunction } from 'express';
import {AppError} from "@/utils/errors";
import {z, ZodError} from "zod";


const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: z.flattenError(err)
        });
    }

    if (err instanceof AppError) {
        const statusCode = err.statusCode || 500;
        if (statusCode === 500) {
            console.error('Handled 500 Error:', err.message);
        }

        return res.status(statusCode).json({
            success: false,
            message: err.message || 'Internal Server Error',
        })
    }

    console.error('UNHANDLED CRITICAL EXCEPTION:', err);

    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    })
}

export default errorHandler;