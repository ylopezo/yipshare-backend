import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {postReport, getMyReports} from "@/controllers/reports.controller.ts";

const router = Router();

router.post('/', authenticationHandler, withPermissions('users:create.reports'), withAuthz(postReport));
router.get('/me', authenticationHandler, withPermissions('users:read.reports.all'),withAuthz(getMyReports));

export default router;