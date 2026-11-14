import {db} from "@/db/db.ts";
import {articleCategories, articles, categories, condominiumMembers, roles, userRoles, users} from "@/db/schema.ts";
import {and, desc, eq, ilike, isNull, sql} from "drizzle-orm";
import {ConflictError, ForbiddenError, NotFoundError} from "@/utils/errors";
import * as z from "zod";
import {ArticleRequest} from "@/schema/articles.schema.ts";

type ArticleData = z.infer<typeof ArticleRequest>;

const isCondominiumAdmin = async (userId: string, condominiumId: string) => {
    const [row] = await db.select({id: userRoles.uuid}).from(userRoles)
        .innerJoin(roles, eq(roles.roleId, userRoles.roleId))
        .where(and(
            eq(userRoles.userId, userId),
            eq(userRoles.condominiumId, condominiumId),
            eq(roles.name, 'condominium_admin'),
        ))
        .limit(1);
    return Boolean(row);
};

const ensureAccess = async (userId: string, condominiumId: string) => {
    const [member] = await db.select({userId: condominiumMembers.userId}).from(condominiumMembers)
        .where(and(eq(condominiumMembers.userId, userId), eq(condominiumMembers.condominiumId, condominiumId)))
        .limit(1);
    if (!member && !(await isCondominiumAdmin(userId, condominiumId)))
        throw new ForbiddenError("Not a member of this condominium");
};

const findCategoryId = async (name: string) => {
    const [category] = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
    if (!category) throw new NotFoundError("Category not found");
    return category.categoryId;
};

const findArticle = async (condominiumId: string, articleId: string) => {
    const [article] = await db.select().from(articles)
        .where(and(
            eq(articles.articleId, articleId),
            eq(articles.condominiumId, condominiumId),
            isNull(articles.deletedAt),
        ))
        .limit(1);
    if (!article) throw new NotFoundError("Article not found");
    return article;
};

export const listArticles = async (userId: string, condominiumId: string, q: string) => {
    await ensureAccess(userId, condominiumId);
    return db.select({
        articleId: articles.articleId,
        name: articles.name,
        description: articles.description,
        state: articles.state,
        availability: articles.availability,
        maximumLendTime: articles.maximumLendTime,
        ownerId: articles.lendingUser,
        owner: users.username,
        rating: sql<number>`${users.computedRating}::float8 / 10`,
        category: categories.name,
    })
        .from(articles)
        .innerJoin(users, eq(users.userId, articles.lendingUser))
        .leftJoin(articleCategories, eq(articleCategories.articleId, articles.articleId))
        .leftJoin(categories, eq(categories.categoryId, articleCategories.categoryId))
        .where(and(
            eq(articles.condominiumId, condominiumId),
            isNull(articles.deletedAt),
            ilike(articles.name, `%${q}%`),
        ))
        .orderBy(desc(articles.articleId));
};

export const createArticle = async (userId: string, condominiumId: string, {category, ...data}: ArticleData) => {
    await ensureAccess(userId, condominiumId);
    const categoryId = await findCategoryId(category);

    return db.transaction(async (tx) => {
        const [article] = await tx.insert(articles)
            .values({...data, condominiumId, lendingUser: userId, availability: 'available'})
            .returning();
        await tx.insert(articleCategories).values({articleId: article!.articleId, categoryId});
        return article;
    });
};

export const updateArticle = async (userId: string, condominiumId: string, articleId: string, {category, ...data}: ArticleData) => {
    const stored = await findArticle(condominiumId, articleId);
    if (stored.lendingUser !== userId) throw new NotFoundError("Article not found");
    if (stored.availability !== 'available') throw new ConflictError("Article is on loan");
    const categoryId = await findCategoryId(category);

    return db.transaction(async (tx) => {
        const [article] = await tx.update(articles).set(data)
            .where(and(eq(articles.articleId, articleId), eq(articles.availability, 'available')))
            .returning();
        if (!article) throw new ConflictError("Article is on loan");
        await tx.delete(articleCategories).where(eq(articleCategories.articleId, articleId));
        await tx.insert(articleCategories).values({articleId, categoryId});
        return article;
    });
};

export const  deleteArticle = async (userId: string, condominiumId: string, articleId: string) => {
    const stored = await findArticle(condominiumId, articleId);

    if (stored.lendingUser === userId) {
        if (stored.availability !== 'available') throw new ConflictError("Article is on loan");
    } else if (!(await isCondominiumAdmin(userId, condominiumId))) {
        throw new NotFoundError("Article not found");
    }

    const [deleted] = await db.update(articles).set({deletedAt: new Date()})
        .where(and(
            eq(articles.articleId, articleId),
            isNull(articles.deletedAt),
            stored.lendingUser === userId ? eq(articles.availability, 'available') : undefined,
        ))
        .returning({id: articles.articleId});
    if (!deleted) throw new ConflictError("Article is on loan");
};