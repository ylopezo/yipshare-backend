import {
    articles,
    categories,
    condominiums, condominiumUnits, loans, notifications,
    permissions, reports, reviews,
    roles,
    sessions,
    temporaryCondominiumVerificationData, userRoles,
    users
} from "@/db/schema.ts";

type RoleSelectType = typeof roles.$inferSelect;
type RoleInsertType = typeof roles.$inferInsert;

type PermissionSelectType = typeof permissions.$inferSelect;
type PermissionInsertType = typeof permissions.$inferInsert;

type CategorySelectType = typeof categories.$inferSelect;
type CategoryInsertType = typeof categories.$inferInsert;

type UserSelectType = typeof users.$inferSelect;
type UserInsertType = typeof users.$inferInsert;

type SessionSelectType = typeof sessions.$inferSelect;
type SessionInsertType = typeof sessions.$inferInsert;

type CondominiumSelectType = typeof condominiums.$inferSelect;
type CondominiumInsertType = typeof condominiums.$inferInsert;
type CondominiumExportType = Omit<CondominiumSelectType, 'shortCode'> & {
    code: string;
};

type TemporaryCondominiumDataSelectType = typeof temporaryCondominiumVerificationData.$inferSelect;
type TemporaryCondominiumDataInsertType = typeof temporaryCondominiumVerificationData.$inferInsert;

type CondominiumUnitSelectType = typeof condominiumUnits.$inferSelect;
type CondominiumUnitInsertType = typeof condominiumUnits.$inferInsert;

type ArticleSelectType = typeof articles.$inferSelect;
type ArticleInsertType = typeof articles.$inferInsert;

type LoansSelectType = typeof loans.$inferSelect;
type LoansInsertType = typeof loans.$inferInsert;

type ReviewSelectType = typeof reviews.$inferSelect;
type ReviewInsertType = typeof reviews.$inferInsert;

type ReportSelectType = typeof reports.$inferSelect;
type ReportInsertType = typeof reports.$inferInsert;

type NotificationSelectType = typeof notifications.$inferSelect;
type NotificationInsertType = typeof notifications.$inferInsert;
