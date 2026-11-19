import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {postReport, getMyReports, getUserReports} from "@/controllers/reports.controller.ts";
import {validImage} from "@/utils/fileValidation.util.ts";
import {imageMulter} from "@/config/multer.ts";
import type {DiskFileHandle, FileHandlesFromSchema} from "@/types/files";

const router = Router();

const reportImgsSchema = {
    images: { required: true, validator: validImage, maxCount: 5},
} as const;

export const uploadReportImgs = imageMulter.schema(reportImgsSchema);

export type ReportImgsHandles = FileHandlesFromSchema<typeof reportImgsSchema, DiskFileHandle>;

router.post('/', authenticationHandler, withPermissions('users:create.reports'), uploadReportImgs, withAuthz<{fileHandles: ReportImgsHandles}>(postReport));
router.get('/me', authenticationHandler, withPermissions('users:read.reports.all'),withAuthz(getMyReports));
router.get('/users/:id', authenticationHandler, withPermissions('users:read.profile'), withAuthz(getUserReports));

export default router;