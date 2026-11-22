import { Router } from "express";
import { authenticationHandler, withAuth } from "@/middlewares/authentication.middleware.ts";
import { withAuthz, withPermissions } from "@/middlewares/authorization.middleware.ts";
import {
    createUser,
    deleteUser,
    deleteUserSelf,
    getListOfUsers,
    getUser,
    getUserSelf,
    getUserProfile,
    modifyUser,
    modifyUserSelf,
    uploadPFP,
} from "@/controllers/users.controller.ts";
import { validImage, validPFP } from "@/utils/fileValidation.util.ts";
import { imageMulter, pfpMulter } from "@/config/multer.ts";
import type { DiskFileHandle, FileHandlesFromSchema } from "@/types/files";
import { resizePFP } from "@/utils/pfp.util.ts";

const router = Router();

const profilePictureSchema = {
    image: { required: true, validator: validPFP, saveBuffer: resizePFP },
} as const;

export const uploadProfilePicture = pfpMulter.schema(profilePictureSchema);

export type PFPImgHandles = FileHandlesFromSchema<typeof profilePictureSchema, DiskFileHandle>;

router.get("/", authenticationHandler, withPermissions("users:read.all"), withAuthz(getListOfUsers));
router.get("/me", authenticationHandler, withPermissions("users:read.self"), withAuthz(getUserSelf));
router.patch("/me", authenticationHandler, withPermissions("users:update.self"), withAuthz(modifyUserSelf));
router.delete("/me", authenticationHandler, withPermissions("users:delete.self"), withAuthz(deleteUserSelf));
router.post(
    "/me/pfp",
    authenticationHandler,
    withPermissions("users:update.self.pfp"),
    uploadProfilePicture,
    withAuthz<{ fileHandles: PFPImgHandles }>(uploadPFP),
);
router.get("/:id/profile", authenticationHandler, withPermissions("users:read.profile"), withAuthz(getUserProfile));
router.get("/:id", authenticationHandler, withPermissions("users:read"), withAuthz(getUser));
router.post("/:id", authenticationHandler, withPermissions("users:create"), withAuthz(createUser));
router.patch("/:id", authenticationHandler, withPermissions("users:update"), withAuthz(modifyUser));
router.delete("/:id", authenticationHandler, withPermissions("users:delete"), withAuthz(deleteUser));

export default router;
