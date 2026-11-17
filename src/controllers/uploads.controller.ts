import type {NextFunction, Request, Response} from "express";
import * as z from "zod";
import {getUploadPath, saveUpload} from "@/services/uploads.service.ts";

const UploadParams = z.object({
    name: z.string().regex(/^[0-9a-f-]{36}\.(jpg|png|pdf)$/),
});

export const postUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const path = await saveUpload(req.headers['content-type'], req.body);
        return res.status(201).json({path});
    } catch (error) {
        next(error);
    }
}

export const getUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {name} = UploadParams.parse(req.params);
        return res.sendFile(await getUploadPath(name));
    } catch (error) {
        next(error);
    }
}
