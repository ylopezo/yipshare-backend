import {Router} from "express";
import {getListOfCondominiums, getCondominium, getCondominiumUnits, postCondominium, patchCondominium, removeCondominium, approveCondominiumHandler} from "@/controllers/condominium.controller.ts";

const router = Router();

router.get('/', getListOfCondominiums);
router.get('/:id', getCondominium);
router.get('/:id/units', getCondominiumUnits);
router.post('/', postCondominium);
router.patch('/:id', patchCondominium);
router.patch('/:id/approve', approveCondominiumHandler);
router.delete('/:id', removeCondominium);

export default router;

