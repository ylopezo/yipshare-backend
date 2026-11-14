import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {
    createRole,
    deleteRole,
    getAllRoles,
    getRole,
    getRoleByName,
    updateRole
} from "@/controllers/roles.controller.ts";

const router = Router();

router.get('/', authenticationHandler, withPermissions('roles:read.all') ,withAuthz(getAllRoles));
router.post('/', authenticationHandler, withPermissions('roles:create') ,withAuthz(createRole));
router.get('/:id', authenticationHandler, withPermissions('roles:read') ,withAuthz(getRole));
router.get('/name/:name', authenticationHandler, withPermissions('roles:read') ,withAuthz(getRoleByName));
router.delete('/:id', authenticationHandler, withPermissions('roles:delete') ,withAuthz(deleteRole));
router.patch('/:id', authenticationHandler, withPermissions('roles:update') ,withAuthz(updateRole));

export default router;