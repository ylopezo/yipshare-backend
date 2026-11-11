import {Router} from "express";
import {getListOfCondominiums, getCondominium, getCondominiumUnits} from "@/controllers/condominium.controller.ts";

const router = Router();

router.get('/', getListOfCondominiums);
router.get('/:id', getCondominium);
router.get('/:id/units', getCondominiumUnits);

export default router;

