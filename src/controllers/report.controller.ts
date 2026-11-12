import type {Response, NextFunction} from "express";
import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import {CreateReportRequest} from "@/schema/report.schema.ts";
import {createReport, getReportsAboutLoan} from "@/services/report.service.ts";

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