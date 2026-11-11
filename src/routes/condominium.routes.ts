import {Router} from "express";
import {getListOfCondominiums} from "@/controllers/condominium.controller.ts";

const router = Router();

router.get('/', getListOfCondominiums);

export default router;

