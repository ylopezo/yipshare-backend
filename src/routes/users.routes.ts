import {Router} from "express";
import {authenticationHandler, withAuth} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {
    createUser,
    deleteUser, deleteUserSelf,
    getListOfUsers,
    getUser,
    getUserSelf,
    modifyUser, modifyUserSelf
} from "@/controllers/users.controller.ts";

const router = Router();

router.get('/', authenticationHandler, withPermissions('users:read.all') ,withAuthz(getListOfUsers));
router.get('/me', authenticationHandler, withPermissions('users:read.self') ,withAuthz(getUserSelf));
router.patch('/me', authenticationHandler, withPermissions('users:update.self'), withAuthz(modifyUserSelf));
router.delete('/me', authenticationHandler, withPermissions('users:delete.self'), withAuthz(deleteUserSelf));
router.get('/:id', authenticationHandler, withPermissions('users:read') ,withAuthz(getUser));
router.post('/:id', authenticationHandler, withPermissions('users:create'), withAuthz(createUser));
router.patch('/:id', authenticationHandler, withPermissions('users:update'), withAuthz(modifyUser));
router.delete('/:id', authenticationHandler, withPermissions('users:delete'), withAuthz(deleteUser));

export default router;

