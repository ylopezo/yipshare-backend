import {Router} from "express";
import {getListOfCondominiums, getCondominium} from "@/controllers/condominium.controller.ts";

const router = Router();

router.get('/', getListOfCondominiums);
router.get('/:id', getCondominium);

export default router;

