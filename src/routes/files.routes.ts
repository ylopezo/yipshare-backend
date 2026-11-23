import express, { Router } from "express";
import { authenticationHandler } from "@/middlewares/authentication.middleware.ts";
import { withPermissions } from "@/middlewares/authorization.middleware.ts";
import {
  getDocument,
  getImage,
  getPFP,
} from "@/controllers/files.controller.ts";

const router = Router();

router.get(
  "/docs/:id",
  authenticationHandler,
  withPermissions("admin:read.docs"),
  getDocument,
);
router.get("/pfp/:id", authenticationHandler, getPFP);
router.get("/image/:id", authenticationHandler, getImage);

export default router;
