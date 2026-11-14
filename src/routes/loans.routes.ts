import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {
    createLoan,
    generateVerificationCode, getLoanFromId,
    getLoanFromIdUser, getLoans,
    getLoansFromLender,
    getLoansFromUser, markAccepted, markRejected, markReturned
} from "@/controllers/loans.controller.ts";

const router = Router();

router.post('/', authenticationHandler, withPermissions('users:create.loans'), withAuthz(createLoan));
router.get('/me', authenticationHandler, withPermissions('users:read.loans.all'), withAuthz(getLoansFromUser));
router.get('/me/lent', authenticationHandler, withPermissions('users:read.loans.all'), withAuthz(getLoansFromLender));
router.get('/me/:id', authenticationHandler, withPermissions('users:read.loans'), withAuthz(getLoanFromIdUser));
router.post('/me/:id/verification-code', authenticationHandler, withPermissions('users:update.loans.verificationCode'),  withAuthz(generateVerificationCode));
router.patch('/me/:id/accept', authenticationHandler, withPermissions('users:update.loans.accept'), withAuthz(markAccepted));
router.patch('/me/:id/return', authenticationHandler, withPermissions('users:update.loans.return'), withAuthz(markReturned));
router.patch('/me/:id/reject', authenticationHandler, withPermissions('users:update.loans.return'), withAuthz(markRejected));

router.get('/', authenticationHandler, withPermissions('loans:read.all'), withAuthz(getLoans));
router.get('/:id', authenticationHandler, withPermissions('loans:read'), withAuthz(getLoanFromId));

export default router;