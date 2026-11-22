import { BadRequestError } from "@/utils/errors.ts";
import { type Multer } from "multer";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { FileHandle, FileSchema } from "@/types/files";
import multer = require("multer");
import { env } from "@/env.ts";

export type MulterWrapper = {
    multer: Multer;
    schema<TSchema extends FileSchema>(schema: TSchema): RequestHandler[];
};

export const wrapMulter = (multerInstance: multer.Multer, baseEndpoint: string) => {
    const resolvedEndpoint = `${env.BASE_URL}${baseEndpoint}`;

    return {
        multer: multerInstance,
        schema<TSchema extends FileSchema>(schema: TSchema): RequestHandler[] {
            const fieldsConfig = Object.entries(schema).map(([name, rule]) => ({
                name,
                maxCount: rule.maxCount ?? 1,
            }));

            const parseFiles = multerInstance.fields(fieldsConfig);

            const buildHandles: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const rawFiles = (req.files as Record<string, Express.Multer.File[]>) ?? {};
                    const fileHandles: Record<string, FileHandle[] | undefined> = {};

                    for (const [fieldName, rule] of Object.entries(schema)) {
                        const files = rawFiles[fieldName];
                        const isMissing = !files || (Array.isArray(files) && files.length === 0);

                        if (isMissing && rule.required)
                            throw new BadRequestError(`Missing required file: ${fieldName}`);

                        if (files) {
                            const validator = rule.validator;
                            if (validator) {
                                const results = await Promise.all(files.map((f) => validator(f)));
                                if (!results.every(Boolean))
                                    throw new BadRequestError(`Invalid file(s) for: ${fieldName}`);
                            }

                            const promises = files.map(async (f): Promise<FileHandle> => {
                                if (f.hash)
                                    return {
                                        kind: "disk",
                                        id: f.hash,
                                        mimeType: f.mimetype,
                                        size: f.size,
                                        url: `${resolvedEndpoint}/${f.hash}`,
                                        path: f.path,
                                    };
                                else if (rule.saveBuffer) {
                                    const { id, path } = await rule.saveBuffer(f.buffer);
                                    return {
                                        kind: "disk",
                                        id: id,
                                        mimeType: f.mimetype,
                                        size: f.size,
                                        url: `${resolvedEndpoint}/${id}`,
                                        path: path,
                                    };
                                } else
                                    return {
                                        kind: "memory",
                                        mimeType: f.mimetype,
                                        size: f.size,
                                        buffer: f.buffer,
                                    };
                            });

                            fileHandles[fieldName] = await Promise.all(promises);
                        }
                    }

                    req.fileHandles = fileHandles;
                    next();
                } catch (e) {
                    next(e);
                }
            };
            return [parseFiles, buildHandles];
        },
    };
};
