import {Router} from "express";
import {getListOfCondominiums, getCondominium, getCondominiumUnits, postCondominium, patchCondominium, removeCondominium, approveCondominiumHandler} from "@/controllers/condominium.controller.ts";
import {authenticationHandler, withAuth} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {getIdFromBody} from "@/middlewares/condominiumGetter.middleware.ts";

const router = Router();

router.get('/', authenticationHandler, withPermissions('condominium:read.all') ,withAuthz(getListOfCondominiums));
router.get('/:id', authenticationHandler, getIdFromBody('id'), withPermissions('condominium:read') ,withAuthz(getCondominium));
router.get('/:id/units/', authenticationHandler, getIdFromBody('id'), withPermissions('condominium:read.units') ,withAuthz(getCondominiumUnits));
router.post('/', authenticationHandler, withPermissions('condominium:create') ,withAuthz(postCondominium));
router.patch('/:id', authenticationHandler, getIdFromBody('id'), withPermissions('condominium:update') ,withAuthz(patchCondominium));
router.post('/:id/approve', authenticationHandler, getIdFromBody('id'), withPermissions('condominium:approve') ,withAuthz(approveCondominiumHandler));
router.delete('/:id', authenticationHandler, getIdFromBody('id'), withPermissions('condominium:delete') ,withAuthz(removeCondominium));

export default router;

