import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz} from "@/middlewares/authorization.middleware.ts";
import {postReport, getMyReports} from "@/controllers/report.controller.ts";

const router = Router();

router.post('/', authenticationHandler, withAuthz(postReport));
router.get('/me', authenticationHandler, withAuthz(getMyReports));

export default router;