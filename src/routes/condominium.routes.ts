import {Router} from "express";
import {
    getListOfCondominiums,
    getCondominium,
    getCondominiumUnits,
    postCondominium,
    patchCondominium,
    removeCondominium,
    approveCondominiumHandler,
    postCondominiumUnit,
    getCondominiumUnit,
    patchCondominiumUnit,
    removeCondominiumUnit,
    postJoinCondominium,
    getCondominiumMembers,
    getCondominiumPendingMembers,
    approveCondominiumMember,
    removeCondominiumMember
} from "@/controllers/condominium.controller.ts";
import {authenticationHandler, withAuth} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {getIdFromParams} from "@/middlewares/condominiumGetter.middleware.ts";
import {getReportsOfCondominium, patchReportState} from "@/controllers/report.controller.ts";

const router = Router();

// Any logged-in user can request to join; they have no condominium-scoped role yet.
router.post('/join', authenticationHandler, withAuthz(postJoinCondominium));

router.get('/', authenticationHandler, withPermissions('condominium:read.all') ,withAuthz(getListOfCondominiums));
router.get('/:id', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:read') ,withAuthz(getCondominium));
router.get('/:id/units/', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:read.units') ,withAuthz(getCondominiumUnits));
router.post('/:id/units', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:create.units') ,withAuthz(postCondominiumUnit));
router.get('/:id/units/:unitId', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:read.units') ,withAuthz(getCondominiumUnit));
router.patch('/:id/units/:unitId', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:update.units') ,withAuthz(patchCondominiumUnit));
router.delete('/:id/units/:unitId', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:delete.units') ,withAuthz(removeCondominiumUnit));
router.post('/', authenticationHandler, withAuthz(postCondominium));
router.patch('/:id', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:update') ,withAuthz(patchCondominium));
router.post('/:id/approve', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:approve') ,withAuthz(approveCondominiumHandler));
router.delete('/:id', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:delete') ,withAuthz(removeCondominium));

router.get('/:id/members', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:read.members'), withAuthz(getCondominiumMembers));
router.get('/:id/members/pending', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:read.members'), withAuthz(getCondominiumPendingMembers));
router.post('/:id/members/:userId/approve', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:approve.members'), withAuthz(approveCondominiumMember));
router.delete('/:id/members/:userId', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:delete.members'), withAuthz(removeCondominiumMember));

router.get('/:id/reports', authenticationHandler, getIdFromParams('id'), withPermissions('report:read'), withAuthz(getReportsOfCondominium));
router.patch('/:id/reports/:reportId', authenticationHandler, getIdFromParams('id'), withPermissions('report:update'), withAuthz(patchReportState));

export default router;

