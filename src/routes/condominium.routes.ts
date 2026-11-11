import {Router} from "express";
import {getListOfCondominiums, getCondominium, getCondominiumUnits, postCondominium} from "@/controllers/condominium.controller.ts";

const router = Router();

router.get('/', getListOfCondominiums);
router.get('/:id', getCondominium);
router.get('/:id/units', getCondominiumUnits);
router.post('/', postCondominium);

export default router;

