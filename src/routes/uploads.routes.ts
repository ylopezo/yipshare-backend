import express, {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {getUpload, postUpload} from "@/controllers/uploads.controller.ts";

const router = Router();

router.post('/', authenticationHandler, express.raw({type: ['image/jpeg', 'image/png', 'application/pdf'], limit: '10mb'}), postUpload);
router.get('/:name', authenticationHandler, getUpload);

export default router;
