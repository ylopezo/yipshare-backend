import {
    pgTable,
    pgEnum,
    uuid,
    varchar,
    char,
    text,
    smallint,
    boolean,
    timestamp,
    jsonb,
    check,
    unique,
    primaryKey, integer, serial
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import {v7 as uuidv7} from 'uuid';

export const userStateEnum = pgEnum('user_state', ['active', 'suspended', 'deleted']);
export const condominiumStateEnum = pgEnum('condominium_state', ['approved', 'pending', 'suspended', 'deleted']);
export const articleStateEnum = pgEnum('article_state', ['excellent', 'good', 'medium', 'bad']);
export const articleAvailabilityEnum = pgEnum('article_availability', ['available', 'not_available', 'pending']);
export const loanStateEnum = pgEnum('loan_state', ['accepted', 'pending', 'returned']);
export const reportStateEnum = pgEnum('report_state', ['pending', 'in_review', 'resolved']);

export const roles = pgTable('roles', {
    roleId: uuid('role_id').primaryKey().$defaultFn(() => uuidv7()),
    name: varchar('name').notNull().unique(),
});

export const permissions = pgTable('permissions', {
    permissionId: uuid('permission_id').primaryKey().$defaultFn(() => uuidv7()),
    name: varchar('name').notNull().unique(),
});

export const categories = pgTable('categories', {
    categoryId: uuid('category_id').primaryKey().$defaultFn(() => uuidv7()),
    name: varchar('name').notNull().unique(),
});

export const users = pgTable('users', {
    userId: uuid('user_id').primaryKey().$defaultFn(() => uuidv7()),
    username: varchar('username').unique(),
    email: varchar('email').unique(),
    passwordHash: varchar('password_hash'),
    paternalSurname: varchar('paternal_surname'),
    maternalSurname: varchar('maternal_surname'),
    name: varchar('name'),
    phoneNumber: varchar('phone_number'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('created_at', { withTimezone: true }),
    computedRating: smallint('computed_rating').notNull().default(0),
    state: userStateEnum('state').notNull().default("active"),
}, (table) => [
    check(
        'chk_active_user_data',
        sql`(${table.state} = 'deleted'::user_state) OR (${table.username} IS NOT NULL AND ${table.passwordHash} IS NOT NULL AND ${table.name} IS NOT NULL)`
    ),
]);

export const sessions = pgTable('sessions', {
    tokenHash: text('token').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.userId),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const condominiums = pgTable('condominiums', {
    condominiumId: uuid('condominium_id').primaryKey().$defaultFn(() => uuidv7()),
    shortCode: serial('short_code').notNull().unique(),
    userId: uuid('user_id').notNull(),
    name: varchar('name').notNull(),
    street: varchar('street').notNull(),
    neighborhood: varchar('neighborhood').notNull(),
    municipality: varchar('municipality').notNull(),
    city: varchar('city').notNull(),
    state: varchar('state').notNull(),
    postalCode: char('postal_code', { length: 5 }).notNull(),
    digitalState: condominiumStateEnum('digital_state').notNull(),
    verificationData: uuid('verification_data'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedBy: uuid('approved_by').references(() => users.userId),
}, (table) => [
    check(
        'chk_approval_metadata',
        sql`(${table.digitalState} <> 'approved') OR (${table.approvedAt} IS NOT NULL AND ${table.approvedBy} IS NOT NULL)`
    ),
]);

export const temporaryCondominiumVerificationData = pgTable('temporary_condominium_verification_data', {
    condominiumId: uuid('condominium_id')
        .primaryKey()
        .references(() => condominiums.condominiumId),
    ecrpcDocument: text('ecrpc_document').notNull(),
    aanaDocument: text('aana_document').notNull(),
    ownerIneDocument: text('owner_ine_document').notNull(),
});

export const condominiumUnits = pgTable('condominium_units', {
    condominiumUnitId: uuid('condominium_unit_id').primaryKey().$defaultFn(() => uuidv7()),
    condominiumId: uuid('condominium_id')
        .notNull()
        .references(() => condominiums.condominiumId),
    name: varchar('name').notNull(),
});

export const articles = pgTable('articles', {
    articleId: uuid('article_id').primaryKey().$defaultFn(() => uuidv7()),
    condominiumId: uuid('condominium_id')
        .notNull()
        .references(() => condominiums.condominiumId),
    lendingUser: uuid('lending_user')
        .notNull()
        .references(() => users.userId),
    name: varchar('name'),
    description: text('description').notNull(),
    state: articleStateEnum('state').notNull(),
    availability: articleAvailabilityEnum('availability').notNull(),
    maximumLendTime: smallint('maximum_lend_time').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
    check('chk_positive_lend_time', sql`${table.maximumLendTime} > 0`),
]);

export const loans = pgTable('loans', {
    loanId: uuid('loan_id').primaryKey().$defaultFn(() => uuidv7()),
    lenderId: uuid('lender_id')
        .notNull()
        .references(() => users.userId),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.userId),
    articleId: uuid('article_id')
        .notNull()
        .references(() => articles.articleId),
    requestText: text('request_text').notNull(),
    confirmationCode: text('confirmation_code'),
    confirmationCodeExpiry: timestamp('confirmation_code_expiry'),
    state: loanStateEnum('state').notNull().default('pending'),
    confirmationTime: timestamp('confirmation_time', { withTimezone: true }),
    returnTime: timestamp('return_time', { withTimezone: true }),
});

export const reviews = pgTable('reviews', {
    reviewId: uuid('review_id').primaryKey().$defaultFn(() => uuidv7()),
    loanId: uuid('loan_id')
        .notNull()
        .references(() => loans.loanId),
    reviewerId: uuid('reviewer_id').notNull().references(() => users.userId),
    reviewedId: uuid('reviewed_id').notNull().references(() => users.userId),
    reviewText: text('review_text').notNull(),
    rating: smallint('rating').notNull(),
}, (table) => [
    check('chk_review_rating_range', sql`${table.rating} BETWEEN 1 AND 5`),
    unique ('uq_review_loan_author').on(table.loanId, table.reviewerId),
]);

export const reports = pgTable('reports', {
    reportId: uuid('report_id').primaryKey().$defaultFn(() => uuidv7()),
    loanId: uuid('loan_id')
        .notNull()
        .references(() => loans.loanId),
    authorId: uuid('author_id').notNull().references(() => users.userId),
    reportText: text('report_text').notNull(),
    state: reportStateEnum('state').notNull().default('pending'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: uuid('resolved_by').references(() => users.userId),
}, (table) => [check(
        'chk_report_resolution',
        sql`(${table.resolvedAt} IS NULL AND ${table.resolvedBy} IS NULL) OR (${table.resolvedAt} IS NOT NULL AND ${table.resolvedBy} IS NOT NULL)`
    ),
    unique('uq_report_loan_author').on(table.loanId, table.authorId),
]);

export const reportEvidences = pgTable('report_evidences', {
    reportEvidenceId: uuid('report_evidence_id').primaryKey().$defaultFn(() => uuidv7()),
    reportId: uuid('report_id')
        .notNull()
        .references(() => reports.reportId),
    image: varchar('image'),
});

export const notifications = pgTable('notifications', {
    notificationId: uuid('notification_id').primaryKey().$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.userId),
    header: varchar('header').notNull(),
    body: text('body').notNull(),
    image: varchar('image'),
    action: jsonb('action').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
});

export const userRoles = pgTable('user_roles', {
    uuid: uuid('uuid').primaryKey().$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.userId),
    condominiumId: uuid('condominium_id').references(() => condominiums.condominiumId),
    roleId: uuid('role_id')
        .notNull()
        .references(() => roles.roleId, { onDelete: 'cascade' }),
    isGlobal: boolean('is_global').notNull(),
}, (table) => [
    unique('uq_user_condominium_role_user_roles')
        .on(table.userId, table.condominiumId, table.roleId)
        .nullsNotDistinct(),
    check(
        'chk_is_global_role_assignment',
        sql`(${table.isGlobal} = TRUE AND ${table.condominiumId} IS NULL) OR (${table.isGlobal} = FALSE AND ${table.condominiumId} IS NOT NULL)`
    ),
]);

export const rolePermissions = pgTable('role_permissions', {
    roleId: uuid('role_id')
        .notNull()
        .references(() => roles.roleId, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
        .notNull()
        .references(() => permissions.permissionId, { onDelete: 'cascade' }),
    allowed: boolean().notNull(),
}, (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] })
]);

export const permissionOverrides = pgTable('permission_overrides', {
    uuid: uuid('uuid').primaryKey().$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.userId),
    condominiumId: uuid('condominium_id').references(() => condominiums.condominiumId),
    permissionId: uuid('permission_id')
        .notNull()
        .references(() => permissions.permissionId, { onDelete: 'cascade' }),
    allowed: boolean().notNull(),
}, (table) => [
    unique('uq_user_condominium_permission_permission_overrides')
        .on(table.userId, table.condominiumId, table.permissionId)
        .nullsNotDistinct(),
]);

export const condominiumMembers = pgTable('condominium_members', {
    userId: uuid('user_id')
        .notNull()
        .references(() => users.userId),
    condominiumId: uuid('condominium_id')
        .notNull()
        .references(() => condominiums.condominiumId),
    condominiumUnitId: uuid('condominium_unit_id')
        .notNull()
        .references(() => condominiumUnits.condominiumUnitId),
}, (table) => [
    primaryKey({ columns: [table.userId, table.condominiumId, table.condominiumUnitId] }),
]);

export const pendingCondominiumMembers = pgTable('pending_condominium_members', {
    userId: uuid('user_id')
        .notNull()
        .references(() => users.userId),
    condominiumId: uuid('condominium_id')
        .notNull()
        .references(() => condominiums.condominiumId),
    unit: varchar('unit', { length: 255 }).notNull(),
    suggestedUnitId: uuid('suggested_unit_id')
        .references(() => condominiumUnits.condominiumUnitId),
}, (table) => [
    primaryKey({ columns: [table.userId, table.condominiumId] }),
]);

export const articleCategories = pgTable('article_categories', {
    articleId: uuid('article_id')
        .notNull()
        .references(() => articles.articleId),
    categoryId: uuid('category_id')
        .notNull()
        .references(() => categories.categoryId, { onDelete: 'cascade' }),
}, (table) => [
    primaryKey({ columns: [table.articleId, table.categoryId] }),
]);