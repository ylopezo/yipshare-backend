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
    'condominium:read.members',
    'condominium:approve.members',
    'condominium:delete.members',
    'report:read',
    'report:update',
    "admin:test",
] as const;

export type RegisteredPermission = (typeof ALL_PERMS)[number];

export type Permission = RegisteredPermission | (string & {});
