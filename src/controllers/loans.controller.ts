import type { AuthorizedRequest } from "@/middlewares/authorization.middleware.ts";
import type { NextFunction, Response } from "express";
import { LoanQueryRequest, LoanRequest, MyLoansQuery, VerificationCodeBody } from "@/schema/loans.schema.ts";
import {
    answerLoanRequestService,
    confirmCodeService,
    createLoanService,
    generateVerificationCodeService,
    getAllLoansFromCondominium,
    getAllLoansService,
    getLoanFromIdSelfService,
    getLoanFromIdService,
    getMyLentLoansService,
    getMyLoansService,
} from "@/services/loans.service.ts";
import { CondominiumIdParams } from "@/schema/condominiums.schema.ts";

export const createLoan = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanRequest.parse(req.body);
        return res.status(201).json(await createLoanService(req.session.userId, data));
    } catch (error) {
        next(error);
    }
};

export const getLoans = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json(await getAllLoansService());
    } catch (error) {
        next(error);
    }
};

export const getLoansFromCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = CondominiumIdParams.parse(req.params);
        return res.status(200).json(await getAllLoansFromCondominium(id));
    } catch (error) {
        next(error);
    }
};

export const getLoanFromId = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        return res.status(200).json(await getLoanFromIdService(data.id));
    } catch (error) {
        next(error);
    }
};

export const getLoanFromIdUser = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        return res.status(200).json(await getLoanFromIdSelfService(req.session.userId, data.id));
    } catch (error) {
        next(error);
    }
};

export const getLoansFromLender = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const { condominiumId } = MyLoansQuery.parse(req.query);
        return res.status(200).json(await getMyLentLoansService(req.session.userId, condominiumId));
    } catch (error) {
        next(error);
    }
};

export const getLoansFromUser = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const { condominiumId } = MyLoansQuery.parse(req.query);
        return res.status(200).json(await getMyLoansService(req.session.userId, condominiumId));
    } catch (error) {
        next(error);
    }
};

export const generateVerificationCode = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        return res.status(200).json(await generateVerificationCodeService(req.session.userId, data.id));
    } catch (error) {
        next(error);
    }
};

export const markAccepted = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        return res.status(200).json(await answerLoanRequestService(req.session.userId, data.id, "accepted"));
    } catch (error) {
        next(error);
    }
};

export const markRejected = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        return res.status(200).json(await answerLoanRequestService(req.session.userId, data.id, "rejected"));
    } catch (error) {
        next(error);
    }
};

export const confirmCode = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        const body = VerificationCodeBody.parse(req.body);
        return res.status(200).json(await confirmCodeService(req.session.userId, data.id, body.code));
    } catch (error) {
        next(error);
    }
};
