import type { Response, NextFunction } from "express";
import type { AuthorizedRequest } from "@/middlewares/authorization.middleware.ts";
import { CreateReportRequest, ReportParams, UpdateReportStateRequest } from "@/schema/reports.schema.ts";
import { CondominiumIdParams } from "@/schema/condominiums.schema.ts";
import { UserIdParams } from "@/schema/users.schema.ts";
import {
    createReport,
    getReportsAboutLoan,
    getCondominiumReports,
    updateReportState,
} from "@/services/reports.service.ts";
import type { ReportImgsHandles } from "@/routes/reports.routes.ts";

export const postReport = async (
    req: AuthorizedRequest<{ fileHandles: ReportImgsHandles }>,
    res: Response,
    next: NextFunction,
) => {
    try {
        const images = req.fileHandles.images.map((k) => k.url);
        const data = CreateReportRequest.parse(req.body);
        return res.status(201).json(await createReport(req.session.userId, data, images));
    } catch (error) {
        next(error);
    }
};

export const getMyReports = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json(await getReportsAboutLoan(req.session.userId));
    } catch (error) {
        next(error);
    }
};

export const getUserReports = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = UserIdParams.parse(req.params);
        return res.status(200).json(await getReportsAboutLoan(id));
    } catch (error) {
        next(error);
    }
};

export const getReportsOfCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = CondominiumIdParams.parse(req.params);
        return res.status(200).json(await getCondominiumReports(id));
    } catch (error) {
        next(error);
    }
};

export const patchReportState = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const { id, reportId } = ReportParams.parse(req.params);
        const { state } = UpdateReportStateRequest.parse(req.body);
        return res.status(200).json(await updateReportState(id, reportId, state, req.session.userId));
    } catch (error) {
        next(error);
    }
};
