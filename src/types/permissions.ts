import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {createUser, deleteUser, getUser, modifyUser} from "@/controllers/users.controller.ts";
import router from "@/routes/users.routes.ts";

export const ALL_PERMS = [
    'condominium:create',
    'condominium:create.units',
    'condominium:update',
    'condominium:update.units',
    'condominium:delete',
    'condominium:delete.units',
    'condominium:read',
    'condominium:read.all',
    'condominium:read.units',
    'condominium:approve',
    'users:read',
    'users:read.all',
    'users:read.self',
    'users:create',
    'users:update',
    'users:update.self',
    'users:delete',
    'users:delete.self',
    "admin:test",
] as const;

export type RegisteredPermission = (typeof ALL_PERMS)[number];

export type Permission = RegisteredPermission | (string & {});
