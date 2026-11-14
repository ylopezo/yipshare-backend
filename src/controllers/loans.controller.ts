import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import type {NextFunction, Response} from "express";
import {LoanQueryRequest, LoanRequest, VerificationCodeBody} from "@/schema/loans.schema.ts";
import {
    createLoanService, generateVerificationCodeService,
    getAllLoansService, getLoanFromIdSelfService, getLoanFromIdService, stateChangeLoanService
} from "@/services/loans.service.ts";
import {LoanLenderRequest, LoanUserRequest} from "@/schema/loans.schema.ts";
import {getAllLoansFromLenderService, getAllLoansFromUserService} from "@/services/loans.service.ts";

export const createLoan = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanRequest.parse(req.body);
        return res.status(201).json(await createLoanService(data));
    } catch (error) {
        next(error);
    }
}

export const getLoans = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json(await getAllLoansService());
    } catch (error) {
        next(error);
    }
}

export const getLoanFromId = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        return res.status(200).json(await getLoanFromIdService(data.id))
    } catch (error) {
        next(error);
    }
}

export const getLoanFromIdUser = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        return res.status(200).json(await getLoanFromIdSelfService(req.session.userId, data.id))
    } catch (error) {
        next(error);
    }
}


export const getLoansFromLender = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanLenderRequest.parse(req.params);
        return res.status(200).json(await getAllLoansFromLenderService(data.id));
    } catch (error) {
        next(error);
    }
}

export const getLoansFromUser = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanUserRequest.parse(req.params);
        return res.status(200).json(await getAllLoansFromUserService(data.id));
    } catch (error) {
        next(error);
    }
}

export const generateVerificationCode = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        return res.status(200).json(await generateVerificationCodeService(req.session.userId, data.id));
    } catch (error) {
        next(error);
    }
}

export const markAccepted = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        const body = VerificationCodeBody.parse(req.body);
        return res.status(200).json(await stateChangeLoanService(req.session.userId, data.id, 'pending', 'accepted', body.code));
    } catch (error) {
        next(error);
    }
}

export const markReturned = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        const body = VerificationCodeBody.parse(req.body);
        return res.status(200).json(await stateChangeLoanService(req.session.userId, data.id, 'accepted', 'returned', body.code));
    } catch (error) {
        next(error);
    }
}
export const markRejected = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = LoanQueryRequest.parse(req.params);
        const body = VerificationCodeBody.parse(req.body);
        return res.status(200).json(await stateChangeLoanService(req.session.userId, data.id, 'accepted', 'rejected', body.code));
    } catch (error) {
        next(error);
    }
}