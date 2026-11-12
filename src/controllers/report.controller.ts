import type {Response, NextFunction} from "express";
import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import {CreateReportRequest, ReportParams, UpdateReportStateRequest} from "@/schema/report.schema.ts";
import {CondominiumIdParams} from "@/schema/condominium.schema.ts";
import {createReport, getReportsAboutLoan, getCondominiumReports, updateReportState} from "@/services/report.service.ts";

export const postReport = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try{
        const data = CreateReportRequest.parse(req.body);
        return res.status(201).json(await createReport(req.session.userId, data));
    } catch (error) {
        next(error);
    }
}

export const getMyReports = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try{
        return res.status(200).json(await getReportsAboutLoan(req.session.userId));
    } catch (error) {
        next(error);
    }
}

export const getReportsOfCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = CondominiumIdParams.parse(req.params);
        return res.status(200).json(await getCondominiumReports(id));
    } catch (error) {
        next(error);
    }
}

export const patchReportState = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id, reportId} = ReportParams.parse(req.params);
        const {state} = UpdateReportStateRequest.parse(req.body);
        return res.status(200).json(await updateReportState(id, reportId, state, req.session.userId));
    } catch (error) {
        next(error);
    }
}
