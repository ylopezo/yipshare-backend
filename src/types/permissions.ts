export const ALL_PERMS = [
    "admin:test",
] as const;

export type RegisteredPermission = (typeof ALL_PERMS)[number];

export type Permission = RegisteredPermission | (string & {});
