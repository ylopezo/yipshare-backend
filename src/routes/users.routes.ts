import {Router} from "express";
import {authenticationHandler, withAuth} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {createUser, deleteUser, getListOfUsers, getUser, modifyUser} from "@/controllers/users.controller.ts";

const router = Router();

router.get('/', authenticationHandler, withPermissions('users:read.all') ,withAuthz(getListOfUsers));
router.get('/:id', authenticationHandler, withPermissions('users:read') ,withAuthz(getUser));
router.post('/:id', authenticationHandler, withPermissions('users:create'), withAuthz(createUser));
router.patch('/:id', authenticationHandler, withPermissions('users:modify'), withAuthz(modifyUser));
router.delete('/:id', authenticationHandler, withPermissions('users:delete'), withAuthz(deleteUser));

export default router;

